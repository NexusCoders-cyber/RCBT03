import axios from 'axios'
import { LEKKI_HEADMASTER_EXAM_QUESTIONS } from '../data/lekkiHeadmaster'
import { saveQuestionsToCache, getQuestionsFromCache, getAllCachedQuestions as getOfflineCachedQuestions } from './offlineStorage'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
const ALOC_API_URL = import.meta.env.VITE_ALOC_API_URL || 'https://questions.aloc.com.ng/api/v2'
const ACCESS_TOKEN = import.meta.env.VITE_ALOC_ACCESS_TOKEN || 'QB-d5c4e46e63efeaa79b0c'

const backendClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

const alocClient = axios.create({
  baseURL: ALOC_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

alocClient.interceptors.request.use((config) => {
  if (ACCESS_TOKEN) {
    config.headers['AccessToken'] = ACCESS_TOKEN
  }
  return config
})

const questionCache = new Map()

const getCacheKey = (subject, count, year, type) => {
  return `${subject}-${count}-${year || 'all'}-${type || 'utme'}`
}

async function fetchWithRetry(client, url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.get(url)
      return response
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
}

async function fetchFromBackend(subject, count, topic = null) {
  try {
    let url = `/api/questions?subject=${subject}&count=${count}`
    if (topic) url += `&topic=${encodeURIComponent(topic)}`
    const response = await fetchWithRetry(backendClient, url, 2, 500)
    return response.data.data || []
  } catch {
    return null
  }
}

async function fetchFromAloc(subject, count, year = null) {
  try {
    let url = `/q/${count}?subject=${subject}&type=utme`
    if (year) url += `&year=${year}`
    const response = await fetchWithRetry(alocClient, url, 3, 1000)
    const questions = response.data.data || response.data || []
    return Array.isArray(questions) ? questions : [questions]
  } catch {
    return null
  }
}

function formatQuestion(question, index, subject) {
  if (!question) return null
  
  const section = question.topic || question.section || ''
  const passage = question.passage || question.comprehension || question.text || null
  
  if (question.options) {
    return {
      id: question.id || index,
      index: index,
      question: question.question || '',
      options: question.options,
      answer: question.answer?.toLowerCase() || '',
      section: section,
      passage: passage,
      image: question.image || question.image_url || null,
      solution: question.solution || question.explanation || '',
      examtype: question.examtype || question.exam_type || 'utme',
      examyear: question.examyear || question.exam_year || '',
      subject: subject,
      isAiGenerated: question.isAiGenerated || false
    }
  }
  
  const options = {}
  if (question.option) {
    options.a = question.option.a || ''
    options.b = question.option.b || ''
    options.c = question.option.c || ''
    options.d = question.option.d || ''
    if (question.option.e) {
      options.e = question.option.e
    }
  }
  
  return {
    id: question.id || index,
    index: index,
    question: question.question || '',
    options: options,
    answer: question.answer?.toLowerCase() || '',
    section: section,
    passage: passage,
    image: question.image || question.image_url || null,
    solution: question.solution || question.explanation || '',
    examtype: question.examtype || 'utme',
    examyear: question.examyear || '',
    subject: subject,
  }
}

export const alocAPI = {
  async getQuestion(subject, year = null) {
    try {
      let url = `/q?subject=${subject}&type=utme`
      if (year) url += `&year=${year}`
      const response = await fetchWithRetry(alocClient, url, 2, 500)
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch question: ${error.message}`)
    }
  },

  async getMultipleQuestions(subject, count = 40, year = null) {
    const cacheKey = getCacheKey(subject, count, year, 'utme')
    
    if (questionCache.has(cacheKey)) {
      const cached = questionCache.get(cacheKey)
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return cached.data
      }
    }
    
    let questions = []
    
    const backendQuestions = await fetchFromBackend(subject, count)
    if (backendQuestions && backendQuestions.length > 0) {
      questions = backendQuestions.map((q, index) => formatQuestion(q, index, subject))
    }
    
    if (questions.length < count) {
      const alocQuestions = await fetchFromAloc(subject, count, year)
      if (alocQuestions && alocQuestions.length > 0) {
        const formatted = alocQuestions.map((q, index) => formatQuestion(q, questions.length + index, subject))
        const existingIds = new Set(questions.map(q => q.id))
        formatted.forEach(q => {
          if (!existingIds.has(q.id) && questions.length < count) {
            questions.push(q)
          }
        })
      }
    }
    
    if (questions.length === 0) {
      const cachedData = await getQuestionsFromCache(subject, year || 'offline')
      if (cachedData) {
        return cachedData.slice(0, count)
      }
      throw new Error(`No questions available for ${subject}`)
    }
    
    questionCache.set(cacheKey, {
      data: questions,
      timestamp: Date.now(),
    })
    
    await saveQuestionsToCache(subject, year || 'api', questions)
    
    return questions.slice(0, count)
  },

  async getBulkQuestions(subject, count = 40) {
    try {
      const url = `/m?subject=${subject}&type=utme`
      const response = await fetchWithRetry(alocClient, url, 3, 1000)
      let questions = response.data.data || response.data || []
      
      if (!Array.isArray(questions)) {
        questions = [questions]
      }
      
      const formattedQuestions = questions
        .slice(0, count)
        .map((q, index) => formatQuestion(q, index, subject))
      
      await saveQuestionsToCache(subject, 'bulk', formattedQuestions)
      
      return formattedQuestions
    } catch {
      const cachedData = await getQuestionsFromCache(subject, 'bulk')
      if (cachedData) {
        return cachedData.slice(0, count)
      }
      return []
    }
  },

  async generateQuestions(subject, topic = null, count = 10) {
    try {
      const response = await backendClient.post('/api/questions/generate', {
        subject,
        topic,
        count
      })
      return response.data.data || []
    } catch {
      return []
    }
  },

  async syncQuestions(subject = null, count = 100) {
    try {
      const response = await backendClient.post('/api/questions/sync', {
        subject,
        count
      })
      return response.data
    } catch {
      return null
    }
  },

  async getStats() {
    try {
      const response = await backendClient.get('/api/stats')
      return response.data
    } catch {
      return null
    }
  },

  async getSubjectMetrics() {
    try {
      const response = await alocClient.get('/metrics/subjects')
      return response.data
    } catch {
      return null
    }
  },

  clearCache() {
    questionCache.clear()
  },

  async getOfflineQuestionCount() {
    try {
      const subjects = ['english', 'mathematics', 'physics', 'chemistry', 'biology', 'literature', 'government', 'commerce', 'accounting', 'economics', 'crk', 'irk', 'geography', 'agric', 'history']
      let total = 0
      const bySubject = {}
      
      for (const subject of subjects) {
        const cached = await getOfflineCachedQuestions(subject)
        if (cached && cached.length > 0) {
          total += cached.length
          bySubject[subject] = cached.length
        }
      }
      
      return { total, bySubject }
    } catch {
      return { total: 0, bySubject: {} }
    }
  }
}

function getLekkiHeadmasterQuestions(count = 15) {
  const allQuestions = LEKKI_HEADMASTER_EXAM_QUESTIONS.map((q, index) => ({
    ...q,
    id: q.id || `lh-exam-${index}`,
    subject: 'english',
    examtype: 'utme',
    examyear: '2024',
    section: 'Literature - The Lekki Headmaster',
    solution: q.explanation || '',
  }))
  return allQuestions.slice(0, count)
}

export async function loadQuestionsForExam(subjects, onProgress = null) {
  const questionsMap = {}
  let loadedSubjects = 0
  
  for (const subject of subjects) {
    const isEnglish = subject.id === 'english'
    const count = subject.count || (isEnglish ? 60 : 40)
    
    try {
      let questions = []
      
      try {
        questions = await alocAPI.getMultipleQuestions(subject.id, count)
      } catch {
        const cachedData = await getQuestionsFromCache(subject.id, 'offline')
        if (cachedData && cachedData.length > 0) {
          questions = cachedData.map((q, i) => formatQuestion(q, i, subject.id))
        }
      }
      
      if (questions.length < count) {
        try {
          const bulkQuestions = await alocAPI.getBulkQuestions(subject.id, count)
          const existingIds = new Set(questions.map(q => q.id))
          
          bulkQuestions.forEach(q => {
            if (!existingIds.has(q.id) && questions.length < count) {
              questions.push(q)
              existingIds.add(q.id)
            }
          })
        } catch {
          const cachedBulk = await getQuestionsFromCache(subject.id, 'bulk')
          if (cachedBulk) {
            const existingIds = new Set(questions.map(q => q.id))
            cachedBulk.forEach(q => {
              if (!existingIds.has(q.id) && questions.length < count) {
                questions.push(q)
                existingIds.add(q.id)
              }
            })
          }
        }
      }
      
      if (isEnglish) {
        const lekkiQuestions = getLekkiHeadmasterQuestions(15)
        const existingIds = new Set(questions.map(q => q.id))
        lekkiQuestions.forEach(q => {
          if (!existingIds.has(q.id)) {
            questions.push(q)
          }
        })
      }
      
      questionsMap[subject.id] = questions.slice(0, isEnglish ? 60 : count)
      loadedSubjects++
      
      if (onProgress) {
        onProgress({
          loaded: loadedSubjects,
          total: subjects.length,
          subject: subject.name,
          questionCount: questions.length,
        })
      }
    } catch {
      const cachedData = await getQuestionsFromCache(subject.id, 'offline')
      if (cachedData && cachedData.length > 0) {
        let questions = cachedData.slice(0, count).map((q, i) => formatQuestion(q, i, subject.id))
        if (isEnglish) {
          const lekkiQuestions = getLekkiHeadmasterQuestions(15)
          const existingIds = new Set(questions.map(q => q.id))
          lekkiQuestions.forEach(q => {
            if (!existingIds.has(q.id)) {
              questions.push(q)
            }
          })
        }
        questionsMap[subject.id] = questions.slice(0, isEnglish ? 60 : count)
      } else {
        questionsMap[subject.id] = isEnglish ? getLekkiHeadmasterQuestions(15) : []
      }
    }
  }
  
  return questionsMap
}

export async function loadPracticeQuestions(subject, count = 40, year = null) {
  const isEnglish = subject.id === 'english'
  
  try {
    let questions = await alocAPI.getMultipleQuestions(subject.id, count, year)
    
    if (questions.length < count) {
      try {
        const bulkQuestions = await alocAPI.getBulkQuestions(subject.id, count)
        const existingIds = new Set(questions.map(q => q.id))
        
        bulkQuestions.forEach(q => {
          if (!existingIds.has(q.id) && questions.length < count) {
            questions.push(q)
          }
        })
      } catch {
      }
    }
    
    if (isEnglish) {
      const lekkiQuestions = getLekkiHeadmasterQuestions(10)
      const existingIds = new Set(questions.map(q => q.id))
      lekkiQuestions.forEach(q => {
        if (!existingIds.has(q.id)) {
          questions.push(q)
        }
      })
    }
    
    return questions.slice(0, isEnglish ? count + 10 : count)
  } catch {
    const cachedData = await getQuestionsFromCache(subject.id, 'offline')
    if (cachedData && cachedData.length > 0) {
      let questions = cachedData.slice(0, count).map((q, i) => formatQuestion(q, i, subject.id))
      if (isEnglish) {
        const lekkiQuestions = getLekkiHeadmasterQuestions(10)
        const existingIds = new Set(questions.map(q => q.id))
        lekkiQuestions.forEach(q => {
          if (!existingIds.has(q.id)) {
            questions.push(q)
          }
        })
      }
      return questions.slice(0, isEnglish ? count + 10 : count)
    }
    
    return isEnglish ? getLekkiHeadmasterQuestions(10) : []
  }
}

export async function searchDictionary(word) {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      timeout: 10000,
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Word not found in dictionary')
    }
    throw new Error('Failed to search dictionary. Please try again.')
  }
}

export async function checkOnlineStatus() {
  return navigator.onLine
}

export default alocAPI
