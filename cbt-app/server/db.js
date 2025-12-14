import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL

let pool = null

function getPool() {
  if (!pool && connectionString) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  return pool
}

export async function initDatabase() {
  const db = getPool()
  if (!db) {
    console.log('No database connection configured, using file storage only')
    return false
  }
  
  const client = await db.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255),
        subject VARCHAR(100) NOT NULL,
        topic VARCHAR(255),
        question TEXT NOT NULL,
        option_a TEXT,
        option_b TEXT,
        option_c TEXT,
        option_d TEXT,
        option_e TEXT,
        answer VARCHAR(10) NOT NULL,
        explanation TEXT,
        exam_type VARCHAR(50) DEFAULT 'utme',
        exam_year VARCHAR(10),
        image_url TEXT,
        is_ai_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(subject, question)
      )
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject)
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic)
    `)
    
    return true
  } finally {
    client.release()
  }
}

export async function saveQuestion(question) {
  const db = getPool()
  if (!db) return null
  
  const client = await db.connect()
  try {
    const result = await client.query(`
      INSERT INTO questions (
        external_id, subject, topic, question, 
        option_a, option_b, option_c, option_d, option_e,
        answer, explanation, exam_type, exam_year, image_url, is_ai_generated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (subject, question) DO UPDATE SET
        option_a = EXCLUDED.option_a,
        option_b = EXCLUDED.option_b,
        option_c = EXCLUDED.option_c,
        option_d = EXCLUDED.option_d,
        answer = EXCLUDED.answer,
        explanation = EXCLUDED.explanation
      RETURNING id
    `, [
      question.external_id || null,
      question.subject,
      question.topic || null,
      question.question,
      question.options?.a || null,
      question.options?.b || null,
      question.options?.c || null,
      question.options?.d || null,
      question.options?.e || null,
      question.answer,
      question.explanation || null,
      question.exam_type || 'utme',
      question.exam_year || null,
      question.image_url || null,
      question.is_ai_generated || false
    ])
    return result.rows[0]
  } finally {
    client.release()
  }
}

export async function saveQuestionsBatch(questions) {
  const saved = []
  for (const q of questions) {
    try {
      const result = await saveQuestion(q)
      if (result) saved.push(result)
    } catch (e) {
      console.error('Error saving question:', e.message)
    }
  }
  return saved
}

export async function getQuestions(subject, count = 40, topic = null) {
  const db = getPool()
  if (!db) return []
  
  const client = await db.connect()
  try {
    let result
    if (topic) {
      result = await client.query(`
        SELECT * FROM questions 
        WHERE subject = $1 AND topic = $2
        ORDER BY RANDOM() 
        LIMIT $3
      `, [subject, topic, count])
    } else {
      result = await client.query(`
        SELECT * FROM questions 
        WHERE subject = $1
        ORDER BY RANDOM() 
        LIMIT $2
      `, [subject, count])
    }
    return result.rows.map(formatDbQuestion)
  } finally {
    client.release()
  }
}

export async function getQuestionCount(subject) {
  const db = getPool()
  if (!db) return 0
  
  const client = await db.connect()
  try {
    const result = await client.query(`
      SELECT COUNT(*) as count FROM questions WHERE subject = $1
    `, [subject])
    return parseInt(result.rows[0]?.count || 0)
  } finally {
    client.release()
  }
}

export async function getAllSubjectCounts() {
  const db = getPool()
  if (!db) return {}
  
  const client = await db.connect()
  try {
    const result = await client.query(`
      SELECT subject, COUNT(*) as count FROM questions GROUP BY subject
    `)
    return result.rows.reduce((acc, row) => {
      acc[row.subject] = parseInt(row.count)
      return acc
    }, {})
  } finally {
    client.release()
  }
}

function formatDbQuestion(row) {
  return {
    id: row.id,
    question: row.question,
    options: {
      a: row.option_a || '',
      b: row.option_b || '',
      c: row.option_c || '',
      d: row.option_d || '',
      ...(row.option_e && { e: row.option_e })
    },
    answer: row.answer,
    solution: row.explanation || '',
    subject: row.subject,
    topic: row.topic,
    examtype: row.exam_type,
    examyear: row.exam_year,
    image: row.image_url,
    isAiGenerated: row.is_ai_generated
  }
}

export async function sql(query, params = []) {
  const db = getPool()
  if (!db) throw new Error('Database not configured')
  
  const client = await db.connect()
  try {
    const result = await client.query(query, params)
    return result.rows
  } finally {
    client.release()
  }
}
