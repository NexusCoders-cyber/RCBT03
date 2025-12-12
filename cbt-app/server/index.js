import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { initDatabase, saveQuestionsBatch, getQuestions, getQuestionCount, getAllSubjectCounts, sql } from './db.js'
import axios from 'axios'

const app = express()
app.use(cors())
app.use(express.json())

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const ALOC_API_URL = 'https://questions.aloc.com.ng/api/v2'
const ALOC_ACCESS_TOKEN = process.env.VITE_ALOC_ACCESS_TOKEN || 'QB-1e5c5f1553ccd8cd9e11'

let genAI = null
function getGenAI() {
  if (!genAI && GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  }
  return genAI
}

const SUBJECTS = {
  english: 'English Language',
  mathematics: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  literature: 'Literature in English',
  government: 'Government',
  commerce: 'Commerce',
  accounting: 'Accounting',
  economics: 'Economics',
  crk: 'Christian Religious Studies',
  irk: 'Islamic Religious Studies',
  geography: 'Geography',
  agric: 'Agricultural Science',
  history: 'History'
}

async function fetchFromAlocAPI(subject, count = 40) {
  try {
    const response = await axios.get(`${ALOC_API_URL}/q/${count}`, {
      params: { subject, type: 'utme' },
      headers: { 'AccessToken': ALOC_ACCESS_TOKEN },
      timeout: 30000
    })
    const questions = response.data.data || response.data || []
    return Array.isArray(questions) ? questions : [questions]
  } catch (error) {
    console.error(`ALOC API error for ${subject}:`, error.message)
    return []
  }
}

function formatAlocQuestion(q, subject) {
  return {
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

  const subjectName = SUBJECTS[subject] || subject
  const prompt = `Generate ${count} JAMB UTME ${subjectName} questions${topic ? ` on the topic "${topic}"` : ''}.

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

  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Invalid AI response format')
  }
  
  const questions = JSON.parse(jsonMatch[0])
  return questions.map(q => ({
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

app.get('/api/questions', async (req, res) => {
  try {
    const { subject, count = 40, topic } = req.query
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' })
    }

    let questions = await getQuestions(subject, parseInt(count), topic)
    
    if (questions.length < parseInt(count)) {
      const alocQuestions = await fetchFromAlocAPI(subject, parseInt(count))
      if (alocQuestions.length > 0) {
        const formatted = alocQuestions.map(q => formatAlocQuestion(q, subject))
        await saveQuestionsBatch(formatted)
        questions = await getQuestions(subject, parseInt(count), topic)
      }
    }
    
    if (questions.length < parseInt(count) && GEMINI_API_KEY) {
      const needed = Math.min(parseInt(count) - questions.length, 10)
      try {
        const aiQuestions = await generateQuestionsWithAI(subject, topic, needed)
        await saveQuestionsBatch(aiQuestions)
        questions = await getQuestions(subject, parseInt(count), topic)
      } catch (e) {
        console.error('AI generation error:', e.message)
      }
    }

    res.json({ 
      data: questions.slice(0, parseInt(count)),
      total: questions.length,
      source: 'database'
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
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
      const alocQuestions = await fetchFromAlocAPI(subj, count)
      if (alocQuestions.length > 0) {
        const formatted = alocQuestions.map(q => formatAlocQuestion(q, subj))
        const saved = await saveQuestionsBatch(formatted)
        results[subj] = { fetched: alocQuestions.length, saved: saved.length }
      } else {
        results[subj] = { fetched: 0, saved: 0 }
      }
    }
    
    res.json({ message: 'Sync completed', results })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/stats', async (req, res) => {
  try {
    const counts = await getAllSubjectCounts()
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    res.json({ subjects: counts, total })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/subjects', (req, res) => {
  res.json(Object.entries(SUBJECTS).map(([id, name]) => ({ id, name })))
})

const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    await initDatabase()
    console.log('Database initialized')
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
