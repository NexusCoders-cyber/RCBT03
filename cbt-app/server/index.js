import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { initDatabase, saveQuestionsBatch, getQuestions, getQuestionCount, getAllSubjectCounts, sql } from './db.js'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const ALOC_API_URL = 'https://questions.aloc.com.ng/api/v2'
const ALOC_ACCESS_TOKEN = process.env.ALOC_ACCESS_TOKEN || 'QB-1e5c5f1553ccd8cd9e11'
const DATA_DIR = path.join(__dirname, 'data')

let genAI = null
function getGenAI() {
  if (!genAI && GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  }
  return genAI
}

const SUBJECTS = {
  english: { name: 'English Language', icon: '📝', color: '#9CA3AF', questionCount: 60 },
  mathematics: { name: 'Mathematics', icon: '🔢', color: '#A855F7', questionCount: 40 },
  physics: { name: 'Physics', icon: '⚡', color: '#EAB308', questionCount: 40 },
  chemistry: { name: 'Chemistry', icon: '🧪', color: '#22C55E', questionCount: 40 },
  biology: { name: 'Biology', icon: '🧬', color: '#EC4899', questionCount: 40 },
  literature: { name: 'Literature in English', icon: '📖', color: '#F97316', questionCount: 40 },
  government: { name: 'Government', icon: '🏛️', color: '#EF4444', questionCount: 40 },
  commerce: { name: 'Commerce', icon: '💼', color: '#14B8A6', questionCount: 40 },
  accounting: { name: 'Accounting', icon: '📊', color: '#6366F1', questionCount: 40 },
  economics: { name: 'Economics', icon: '📈', color: '#06B6D4', questionCount: 40 },
  crk: { name: 'Christian Religious Studies', icon: '✝️', color: '#F59E0B', questionCount: 40 },
  irk: { name: 'Islamic Religious Studies', icon: '☪️', color: '#10B981', questionCount: 40 },
  geography: { name: 'Geography', icon: '🌍', color: '#84CC16', questionCount: 40 },
  agric: { name: 'Agricultural Science', icon: '🌾', color: '#22C55E', questionCount: 40 },
  history: { name: 'History', icon: '📜', color: '#A16207', questionCount: 40 }
}

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

async function loadQuestionsFromFile(subject) {
  try {
    const filePath = path.join(DATA_DIR, `${subject}.json`)
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveQuestionsToFile(subject, questions) {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, `${subject}.json`)
  const existingQuestions = await loadQuestionsFromFile(subject)
  
  const questionMap = new Map()
  existingQuestions.forEach(q => {
    const key = q.question?.substring(0, 100) || q.id
    questionMap.set(key, q)
  })
  
  questions.forEach(q => {
    const key = q.question?.substring(0, 100) || q.id
    if (!questionMap.has(key)) {
      questionMap.set(key, q)
    }
  })
  
  const mergedQuestions = Array.from(questionMap.values())
  await fs.writeFile(filePath, JSON.stringify(mergedQuestions, null, 2))
  return mergedQuestions.length
}

async function fetchFromAlocAPI(subject, count = 40, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(`${ALOC_API_URL}/q/${count}`, {
        params: { subject, type: 'utme' },
        headers: { 'AccessToken': ALOC_ACCESS_TOKEN },
        timeout: 30000
      })
      const questions = response.data.data || response.data || []
      return Array.isArray(questions) ? questions : [questions]
    } catch (error) {
      if (attempt === retries - 1) {
        console.error(`ALOC API error for ${subject} after ${retries} attempts:`, error.message)
        return []
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  return []
}

async function fetchBulkFromAlocAPI(subject) {
  try {
    const response = await axios.get(`${ALOC_API_URL}/m`, {
      params: { subject, type: 'utme' },
      headers: { 'AccessToken': ALOC_ACCESS_TOKEN },
      timeout: 60000
    })
    const questions = response.data.data || response.data || []
    return Array.isArray(questions) ? questions : [questions]
  } catch (error) {
    console.error(`ALOC Bulk API error for ${subject}:`, error.message)
    return []
  }
}

function formatAlocQuestion(q, subject) {
  return {
    id: q.id?.toString() || `${subject}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    external_id: q.id?.toString(),
    subject,
    topic: q.section || null,
    question: q.question,
    options: {
      a: q.option?.a || '',
      b: q.option?.b || '',
      c: q.option?.c || '',
      d: q.option?.d || '',
      e: q.option?.e || null
    },
    answer: q.answer?.toLowerCase(),
    explanation: q.solution || q.explanation || null,
    exam_type: q.examtype || 'utme',
    exam_year: q.examyear || null,
    image_url: q.image || null,
    is_ai_generated: false
  }
}

async function generateQuestionsWithAI(subject, topic, count = 5) {
  const ai = getGenAI()
  if (!ai) {
    throw new Error('AI not configured')
  }

  const subjectInfo = SUBJECTS[subject] || { name: subject }
  const prompt = `Generate ${count} JAMB UTME ${subjectInfo.name} questions${topic ? ` on the topic "${topic}"` : ''}.

Return ONLY a JSON array with this exact format:
[
  {
    "question": "The question text here?",
    "options": {"a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D"},
    "answer": "a",
    "explanation": "Brief explanation of why this answer is correct"
  }
]

Requirements:
- Questions must be appropriate for Nigerian JAMB UTME level
- Each question must have exactly 4 options (a, b, c, d)
- Answer must be a single letter (a, b, c, or d)
- Include a brief explanation for each answer
- Make questions challenging but fair
- Output ONLY the JSON array, no other text`

  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
  
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Invalid AI response format')
  }
  
  const questions = JSON.parse(jsonMatch[0])
  return questions.map((q, idx) => ({
    id: `ai-${subject}-${Date.now()}-${idx}`,
    subject,
    topic,
    question: q.question,
    options: q.options,
    answer: q.answer.toLowerCase(),
    explanation: q.explanation,
    exam_type: 'utme',
    is_ai_generated: true
  }))
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.get('/api/subjects', (req, res) => {
  const subjectList = Object.entries(SUBJECTS).map(([id, info]) => ({
    id,
    name: info.name,
    icon: info.icon,
    color: info.color,
    questionCount: info.questionCount
  }))
  res.json(subjectList)
})

app.get('/api/questions', async (req, res) => {
  try {
    const { subject, count = 40, topic } = req.query
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' })
    }

    let questions = []
    const requestedCount = parseInt(count)
    
    const fileQuestions = await loadQuestionsFromFile(subject)
    if (fileQuestions.length > 0) {
      const shuffled = fileQuestions.sort(() => Math.random() - 0.5)
      questions = shuffled.slice(0, requestedCount)
    }
    
    if (questions.length < requestedCount) {
      try {
        const dbQuestions = await getQuestions(subject, requestedCount, topic)
        const existingIds = new Set(questions.map(q => q.id || q.question?.substring(0, 50)))
        dbQuestions.forEach(q => {
          const key = q.id || q.question?.substring(0, 50)
          if (!existingIds.has(key) && questions.length < requestedCount) {
            questions.push(q)
            existingIds.add(key)
          }
        })
      } catch (dbError) {
        console.error('DB fetch error:', dbError.message)
      }
    }
    
    if (questions.length < requestedCount) {
      const alocQuestions = await fetchFromAlocAPI(subject, requestedCount)
      if (alocQuestions.length > 0) {
        const formatted = alocQuestions.map(q => formatAlocQuestion(q, subject))
        const existingIds = new Set(questions.map(q => q.id || q.question?.substring(0, 50)))
        formatted.forEach(q => {
          const key = q.id || q.question?.substring(0, 50)
          if (!existingIds.has(key) && questions.length < requestedCount) {
            questions.push(q)
            existingIds.add(key)
          }
        })
        
        saveQuestionsToFile(subject, formatted).catch(console.error)
        saveQuestionsBatch(formatted).catch(console.error)
      }
    }

    res.json({ 
      data: questions.slice(0, requestedCount),
      total: questions.length,
      source: questions.length > 0 ? 'cached' : 'empty'
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/questions/offline/:subject', async (req, res) => {
  try {
    const { subject } = req.params
    const questions = await loadQuestionsFromFile(subject)
    res.json({
      subject,
      count: questions.length,
      questions
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/questions/generate', async (req, res) => {
  try {
    const { subject, topic, count = 10 } = req.body
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' })
    }

    if (!GEMINI_API_KEY) {
      return res.status(400).json({ error: 'AI generation not available' })
    }

    const questions = await generateQuestionsWithAI(subject, topic, Math.min(count, 20))
    await saveQuestionsBatch(questions)
    await saveQuestionsToFile(subject, questions)
    
    res.json({ 
      data: questions,
      count: questions.length,
      message: `Generated ${questions.length} questions for ${subject}`
    })
  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/questions/sync', async (req, res) => {
  try {
    const { subject, count = 100 } = req.body
    const subjects = subject ? [subject] : Object.keys(SUBJECTS)
    
    const results = {}
    for (const subj of subjects) {
      const alocQuestions = await fetchFromAlocAPI(subj, Math.min(count, 40))
      const bulkQuestions = await fetchBulkFromAlocAPI(subj)
      
      const allQuestions = [...alocQuestions, ...bulkQuestions]
      
      if (allQuestions.length > 0) {
        const formatted = allQuestions.map(q => formatAlocQuestion(q, subj))
        const savedToFile = await saveQuestionsToFile(subj, formatted)
        const savedToDb = await saveQuestionsBatch(formatted)
        results[subj] = { 
          fetched: allQuestions.length, 
          savedToFile,
          savedToDb: savedToDb.length 
        }
      } else {
        results[subj] = { fetched: 0, savedToFile: 0, savedToDb: 0 }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    res.json({ message: 'Sync completed', results })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/questions/bulk-download', async (req, res) => {
  try {
    const subjects = Object.keys(SUBJECTS)
    const results = {}
    let totalQuestions = 0
    
    for (const subject of subjects) {
      const existingCount = (await loadQuestionsFromFile(subject)).length
      
      if (existingCount < 100) {
        const questions1 = await fetchFromAlocAPI(subject, 40)
        await new Promise(resolve => setTimeout(resolve, 300))
        const questions2 = await fetchFromAlocAPI(subject, 40)
        await new Promise(resolve => setTimeout(resolve, 300))
        const bulkQuestions = await fetchBulkFromAlocAPI(subject)
        
        const allQuestions = [...questions1, ...questions2, ...bulkQuestions]
        
        if (allQuestions.length > 0) {
          const formatted = allQuestions.map(q => formatAlocQuestion(q, subject))
          const savedCount = await saveQuestionsToFile(subject, formatted)
          await saveQuestionsBatch(formatted)
          results[subject] = { downloaded: allQuestions.length, total: savedCount }
          totalQuestions += savedCount
        } else {
          results[subject] = { downloaded: 0, total: existingCount }
          totalQuestions += existingCount
        }
      } else {
        results[subject] = { downloaded: 0, total: existingCount, status: 'already cached' }
        totalQuestions += existingCount
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    res.json({ 
      message: 'Bulk download completed',
      totalQuestions,
      results 
    })
  } catch (error) {
    console.error('Bulk download error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/stats', async (req, res) => {
  try {
    const fileStats = {}
    for (const subject of Object.keys(SUBJECTS)) {
      const questions = await loadQuestionsFromFile(subject)
      fileStats[subject] = questions.length
    }
    
    let dbStats = {}
    try {
      dbStats = await getAllSubjectCounts()
    } catch {
      dbStats = {}
    }
    
    const combinedStats = {}
    for (const subject of Object.keys(SUBJECTS)) {
      combinedStats[subject] = Math.max(fileStats[subject] || 0, dbStats[subject] || 0)
    }
    
    const total = Object.values(combinedStats).reduce((a, b) => a + b, 0)
    res.json({ 
      subjects: combinedStats, 
      total,
      offline: fileStats,
      database: dbStats
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/offline-status', async (req, res) => {
  try {
    const status = {}
    for (const subject of Object.keys(SUBJECTS)) {
      const questions = await loadQuestionsFromFile(subject)
      status[subject] = {
        available: questions.length > 0,
        count: questions.length,
        ready: questions.length >= 40
      }
    }
    
    const totalReady = Object.values(status).filter(s => s.ready).length
    const totalSubjects = Object.keys(SUBJECTS).length
    
    res.json({
      subjects: status,
      overallReady: totalReady === totalSubjects,
      readyCount: totalReady,
      totalSubjects
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    await ensureDataDir()
    
    try {
      await initDatabase()
      console.log('Database initialized')
    } catch (dbError) {
      console.warn('Database initialization warning:', dbError.message)
      console.log('Continuing with file-based storage...')
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server running on port ${PORT}`)
      console.log(`Data directory: ${DATA_DIR}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
