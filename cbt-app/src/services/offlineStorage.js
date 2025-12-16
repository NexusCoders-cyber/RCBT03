import { openDB as idbOpenDB } from 'idb'

const DB_NAME = 'jamb-cbt-offline'
const DB_VERSION = 7
const QUESTIONS_STORE = 'questions'
const FLASHCARDS_STORE = 'flashcards'
const NOVEL_STORE = 'novel'
const GENERATED_CONTENT_STORE = 'generated_content'

let dbPromise = null

export async function openDB() {
  if (dbPromise) return dbPromise
  
  dbPromise = idbOpenDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(QUESTIONS_STORE)) {
        const store = database.createObjectStore(QUESTIONS_STORE, { keyPath: 'cacheKey' })
        store.createIndex('subject', 'subject', { unique: false })
        store.createIndex('year', 'year', { unique: false })
      }
      
      if (!database.objectStoreNames.contains(FLASHCARDS_STORE)) {
        const store = database.createObjectStore(FLASHCARDS_STORE, { keyPath: 'id' })
        store.createIndex('subject', 'subject', { unique: false })
        store.createIndex('topic', 'topic', { unique: false })
      }
      
      if (!database.objectStoreNames.contains(NOVEL_STORE)) {
        database.createObjectStore(NOVEL_STORE, { keyPath: 'id' })
      }
      
      if (!database.objectStoreNames.contains('ai_cache')) {
        database.createObjectStore('ai_cache', { keyPath: 'cacheKey' })
      }
      
      if (!database.objectStoreNames.contains('ai_history')) {
        database.createObjectStore('ai_history', { keyPath: 'id' })
      }
      
      if (!database.objectStoreNames.contains(GENERATED_CONTENT_STORE)) {
        database.createObjectStore(GENERATED_CONTENT_STORE, { keyPath: 'id' })
      }
    }
  })
  
  return dbPromise
}

export async function saveQuestionsToCache(subject, year, questions) {
  try {
    const database = await openDB()
    const cacheKey = `${subject}-${year || 'random'}`
    
    await database.put(QUESTIONS_STORE, { 
      cacheKey, 
      subject, 
      year, 
      questions, 
      timestamp: Date.now() 
    })
    
    return true
  } catch {
    return false
  }
}

export async function getQuestionsFromCache(subject, year) {
  try {
    const database = await openDB()
    const cacheKey = `${subject}-${year || 'random'}`
    const result = await database.get(QUESTIONS_STORE, cacheKey)
    
    if (result && result.questions) {
      return result.questions
    }
    return null
  } catch {
    return null
  }
}

export async function getAllCachedQuestions(subject) {
  try {
    const database = await openDB()
    const results = await database.getAllFromIndex(QUESTIONS_STORE, 'subject', subject)
    return results.flatMap(r => r.questions || [])
  } catch {
    return []
  }
}

export async function saveFlashcard(flashcard) {
  try {
    const database = await openDB()
    
    const cardToSave = {
      ...flashcard,
      id: flashcard.id || `fc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: flashcard.createdAt || Date.now()
    }
    
    await database.put(FLASHCARDS_STORE, cardToSave)
    return cardToSave
  } catch {
    return null
  }
}

export async function getFlashcards(subject = null, topic = null) {
  try {
    const database = await openDB()
    
    let results
    if (subject) {
      results = await database.getAllFromIndex(FLASHCARDS_STORE, 'subject', subject)
    } else {
      results = await database.getAll(FLASHCARDS_STORE)
    }
    
    if (topic) {
      results = results.filter(fc => fc.topic === topic)
    }
    
    return results.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export async function deleteFlashcard(id) {
  try {
    const database = await openDB()
    await database.delete(FLASHCARDS_STORE, id)
    return true
  } catch {
    return false
  }
}

export async function updateFlashcardProgress(id, correct, difficulty = 'normal') {
  try {
    const database = await openDB()
    const flashcard = await database.get(FLASHCARDS_STORE, id)
    
    if (flashcard) {
      flashcard.reviewCount = (flashcard.reviewCount || 0) + 1
      flashcard.correctCount = (flashcard.correctCount || 0) + (correct ? 1 : 0)
      flashcard.lastReviewed = Date.now()
      
      const currentEase = flashcard.easeFactor || 2.5
      const currentInterval = flashcard.interval || 1
      
      if (correct) {
        if (difficulty === 'easy') {
          flashcard.easeFactor = Math.min(currentEase + 0.15, 3.0)
          flashcard.interval = Math.round(currentInterval * flashcard.easeFactor * 1.3)
        } else if (difficulty === 'hard') {
          flashcard.easeFactor = Math.max(currentEase - 0.2, 1.3)
          flashcard.interval = Math.round(currentInterval * 1.2)
        } else {
          flashcard.easeFactor = currentEase
          flashcard.interval = Math.round(currentInterval * flashcard.easeFactor)
        }
        flashcard.streak = (flashcard.streak || 0) + 1
      } else {
        flashcard.easeFactor = Math.max(currentEase - 0.2, 1.3)
        flashcard.interval = 1
        flashcard.streak = 0
      }
      
      flashcard.nextReview = Date.now() + (flashcard.interval * 24 * 60 * 60 * 1000)
      flashcard.mastery = Math.min(100, Math.round((flashcard.correctCount / flashcard.reviewCount) * 100))
      
      await database.put(FLASHCARDS_STORE, flashcard)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function getFlashcardsForReview(subject = null) {
  try {
    const allCards = await getFlashcards(subject)
    const now = Date.now()
    
    const dueCards = allCards.filter(card => {
      if (!card.nextReview) return true
      return card.nextReview <= now
    })
    
    dueCards.sort((a, b) => {
      const aMastery = a.mastery || 0
      const bMastery = b.mastery || 0
      return aMastery - bMastery
    })
    
    return dueCards
  } catch {
    return []
  }
}

export async function getFlashcardStats() {
  try {
    const allCards = await getFlashcards()
    const now = Date.now()
    
    const stats = {
      total: allCards.length,
      mastered: 0,
      learning: 0,
      new: 0,
      dueToday: 0,
      totalReviews: 0,
      averageMastery: 0
    }
    
    let totalMastery = 0
    
    allCards.forEach(card => {
      const mastery = card.mastery || 0
      const reviewCount = card.reviewCount || 0
      
      if (reviewCount === 0) {
        stats.new++
      } else if (mastery >= 80) {
        stats.mastered++
      } else {
        stats.learning++
      }
      
      if (!card.nextReview || card.nextReview <= now) {
        stats.dueToday++
      }
      
      stats.totalReviews += reviewCount
      totalMastery += mastery
    })
    
    stats.averageMastery = allCards.length > 0 ? Math.round(totalMastery / allCards.length) : 0
    
    return stats
  } catch {
    return { total: 0, mastered: 0, learning: 0, new: 0, dueToday: 0, totalReviews: 0, averageMastery: 0 }
  }
}

export async function saveNovelContent(novelData) {
  try {
    const database = await openDB()
    await database.put(NOVEL_STORE, novelData)
    return true
  } catch {
    return false
  }
}

export async function getNovelContent(id) {
  try {
    const database = await openDB()
    return await database.get(NOVEL_STORE, id) || null
  } catch {
    return null
  }
}

export async function getAllNovels() {
  try {
    const database = await openDB()
    return await database.getAll(NOVEL_STORE) || []
  } catch {
    return []
  }
}

export async function saveGeneratedContent(id, content) {
  try {
    const database = await openDB()
    await database.put(GENERATED_CONTENT_STORE, { id, content, timestamp: Date.now() })
    return true
  } catch {
    return false
  }
}

export async function getGeneratedContent(id) {
  try {
    const database = await openDB()
    const result = await database.get(GENERATED_CONTENT_STORE, id)
    return result?.content || null
  } catch {
    return null
  }
}

export async function getCacheStats() {
  try {
    const database = await openDB()
    
    const questionsResults = await database.getAll(QUESTIONS_STORE)
    const flashcardsCount = await database.count(FLASHCARDS_STORE)
    
    const stats = {
      questions: 0,
      flashcards: flashcardsCount,
      subjects: new Set(),
      years: new Set()
    }
    
    questionsResults.forEach(r => {
      stats.questions += (r.questions?.length || 0)
      if (r.subject) stats.subjects.add(r.subject)
      if (r.year) stats.years.add(r.year)
    })
    
    return {
      questions: stats.questions,
      flashcards: stats.flashcards,
      subjects: Array.from(stats.subjects),
      years: Array.from(stats.years)
    }
  } catch {
    return { questions: 0, flashcards: 0, subjects: [], years: [] }
  }
}

export async function downloadQuestionsForOffline(subjects, onProgress = null) {
  const results = { success: [], failed: [] }
  
  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i]
    try {
      const response = await fetch(`https://questions.aloc.com.ng/api/v2/m?subject=${subject.id}&type=utme`, {
        headers: {
          'AccessToken': 'QB-1e5c5f1553ccd8cd9e11'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const questions = data.data || data || []
        
        if (questions.length > 0) {
          await saveQuestionsToCache(subject.id, 'offline', questions)
          results.success.push(subject.id)
        }
      }
    } catch {
      results.failed.push(subject.id)
    }
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: subjects.length,
        subject: subject.name,
        success: results.success.length,
        failed: results.failed.length
      })
    }
  }
  
  return results
}

export async function prefetchAllQuestionsForOffline() {
  const subjects = [
    { id: 'english', name: 'English Language' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'biology', name: 'Biology' },
    { id: 'literature', name: 'Literature in English' },
    { id: 'government', name: 'Government' },
    { id: 'commerce', name: 'Commerce' },
    { id: 'accounting', name: 'Accounting' },
    { id: 'economics', name: 'Economics' },
    { id: 'crk', name: 'Christian Religious Studies' },
    { id: 'irk', name: 'Islamic Religious Studies' },
    { id: 'geography', name: 'Geography' },
    { id: 'agric', name: 'Agricultural Science' },
    { id: 'history', name: 'History' }
  ]
  
  const results = { success: [], failed: [] }
  
  for (const subject of subjects) {
    try {
      const existing = await getQuestionsFromCache(subject.id, 'offline')
      if (existing && existing.length > 50) {
        results.success.push(subject.id)
        continue
      }
      
      const response = await fetch(`https://questions.aloc.com.ng/api/v2/m?subject=${subject.id}&type=utme`, {
        headers: {
          'Accept': 'application/json',
          'AccessToken': 'QB-1e5c5f1553ccd8cd9e11'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const questions = data.data || data || []
        
        if (questions.length > 0) {
          await saveQuestionsToCache(subject.id, 'offline', questions)
          results.success.push(subject.id)
        }
      }
    } catch {
      results.failed.push(subject.id)
    }
  }
  
  return results
}

export default {
  openDB,
  saveQuestionsToCache,
  getQuestionsFromCache,
  getAllCachedQuestions,
  saveFlashcard,
  getFlashcards,
  deleteFlashcard,
  updateFlashcardProgress,
  getFlashcardsForReview,
  getFlashcardStats,
  saveNovelContent,
  getNovelContent,
  getAllNovels,
  saveGeneratedContent,
  getGeneratedContent,
  getCacheStats,
  downloadQuestionsForOffline,
  prefetchAllQuestionsForOffline
}
