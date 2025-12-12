import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = neon(process.env.DATABASE_URL)
export const db = drizzle(sql)

export async function initDatabase() {
  await sql`
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
  `
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject)
  `
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic)
  `
  
  return true
}

export async function saveQuestion(question) {
  const result = await sql`
    INSERT INTO questions (
      external_id, subject, topic, question, 
      option_a, option_b, option_c, option_d, option_e,
      answer, explanation, exam_type, exam_year, image_url, is_ai_generated
    ) VALUES (
      ${question.external_id || null},
      ${question.subject},
      ${question.topic || null},
      ${question.question},
      ${question.options?.a || null},
      ${question.options?.b || null},
      ${question.options?.c || null},
      ${question.options?.d || null},
      ${question.options?.e || null},
      ${question.answer},
      ${question.explanation || null},
      ${question.exam_type || 'utme'},
      ${question.exam_year || null},
      ${question.image_url || null},
      ${question.is_ai_generated || false}
    )
    ON CONFLICT (subject, question) DO UPDATE SET
      option_a = EXCLUDED.option_a,
      option_b = EXCLUDED.option_b,
      option_c = EXCLUDED.option_c,
      option_d = EXCLUDED.option_d,
      answer = EXCLUDED.answer,
      explanation = EXCLUDED.explanation
    RETURNING id
  `
  return result[0]
}

export async function saveQuestionsBatch(questions) {
  const saved = []
  for (const q of questions) {
    try {
      const result = await saveQuestion(q)
      saved.push(result)
    } catch (e) {
      console.error('Error saving question:', e.message)
    }
  }
  return saved
}

export async function getQuestions(subject, count = 40, topic = null) {
  let result
  if (topic) {
    result = await sql`
      SELECT * FROM questions 
      WHERE subject = ${subject} AND topic = ${topic}
      ORDER BY RANDOM() 
      LIMIT ${count}
    `
  } else {
    result = await sql`
      SELECT * FROM questions 
      WHERE subject = ${subject}
      ORDER BY RANDOM() 
      LIMIT ${count}
    `
  }
  return result.map(formatDbQuestion)
}

export async function getQuestionCount(subject) {
  const result = await sql`
    SELECT COUNT(*) as count FROM questions WHERE subject = ${subject}
  `
  return parseInt(result[0]?.count || 0)
}

export async function getAllSubjectCounts() {
  const result = await sql`
    SELECT subject, COUNT(*) as count FROM questions GROUP BY subject
  `
  return result.reduce((acc, row) => {
    acc[row.subject] = parseInt(row.count)
    return acc
  }, {})
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

export { sql }
