const DB_NAME = 'jamb-cbt-offline'
const DB_VERSION = 4
const QUESTIONS_STORE = 'questions'
const FLASHCARDS_STORE = 'flashcards'
const NOVEL_STORE = 'novel'
const GENERATED_CONTENT_STORE = 'generated_content'

let db = null

export async function openDB() {
  if (db) return db
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result
      
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
}

export async function saveQuestionsToCache(subject, year, questions) {
  try {
    const database = await openDB()
    const cacheKey = `${subject}-${year || 'random'}`
    
    return new Promise((resolve) => {
      const transaction = database.transaction(QUESTIONS_STORE, 'readwrite')
      const store = transaction.objectStore(QUESTIONS_STORE)
      
      store.put({ 
        cacheKey, 
        subject, 
        year, 
        questions, 
        timestamp: Date.now() 
      })
      
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

export async function getQuestionsFromCache(subject, year) {
  try {
    const database = await openDB()
    const cacheKey = `${subject}-${year || 'random'}`
    
    return new Promise((resolve) => {
      const transaction = database.transaction(QUESTIONS_STORE, 'readonly')
      const store = transaction.objectStore(QUESTIONS_STORE)
      const request = store.get(cacheKey)
      
      request.onsuccess = () => {
        const result = request.result
        if (result && result.questions) {
          resolve(result.questions)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function getAllCachedQuestions(subject) {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(QUESTIONS_STORE, 'readonly')
      const store = transaction.objectStore(QUESTIONS_STORE)
      const index = store.index('subject')
      const request = index.getAll(subject)
      
      request.onsuccess = () => {
        const results = request.result || []
        const allQuestions = results.flatMap(r => r.questions || [])
        resolve(allQuestions)
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function saveFlashcard(flashcard) {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(FLASHCARDS_STORE, 'readwrite')
      const store = transaction.objectStore(FLASHCARDS_STORE)
      
      const cardToSave = {
        ...flashcard,
        id: flashcard.id || `fc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: flashcard.createdAt || Date.now()
      }
      
      store.put(cardToSave)
      
      transaction.oncomplete = () => resolve(cardToSave)
      transaction.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function getFlashcards(subject = null, topic = null) {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(FLASHCARDS_STORE, 'readonly')
      const store = transaction.objectStore(FLASHCARDS_STORE)
      
      let request
      if (subject) {
        const index = store.index('subject')
        request = index.getAll(subject)
      } else {
        request = store.getAll()
      }
      
      request.onsuccess = () => {
        let results = request.result || []
        if (topic) {
          results = results.filter(fc => fc.topic === topic)
        }
        resolve(results.sort((a, b) => b.createdAt - a.createdAt))
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function deleteFlashcard(id) {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(FLASHCARDS_STORE, 'readwrite')
      const store = transaction.objectStore(FLASHCARDS_STORE)
      
      store.delete(id)
      
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

export async function updateFlashcardProgress(id, correct) {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(FLASHCARDS_STORE, 'readwrite')
      const store = transaction.objectStore(FLASHCARDS_STORE)
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const flashcard = getRequest.result
        if (flashcard) {
          flashcard.reviewCount = (flashcard.reviewCount || 0) + 1
          flashcard.correctCount = (flashcard.correctCount || 0) + (correct ? 1 : 0)
          flashcard.lastReviewed = Date.now()
          store.put(flashcard)
        }
      }
      
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

export async function saveNovelContent(novelData) {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(NOVEL_STORE, 'readwrite')
      const store = transaction.objectStore(NOVEL_STORE)
      
      store.put(novelData)
      
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

export async function getNovelContent(id) {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(NOVEL_STORE, 'readonly')
      const store = transaction.objectStore(NOVEL_STORE)
      const request = store.get(id)
      
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function getAllNovels() {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(NOVEL_STORE, 'readonly')
      const store = transaction.objectStore(NOVEL_STORE)
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function saveGeneratedContent(id, content) {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(GENERATED_CONTENT_STORE, 'readwrite')
      const store = transaction.objectStore(GENERATED_CONTENT_STORE)
      
      store.put({ id, content, timestamp: Date.now() })
      
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

export async function getGeneratedContent(id) {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const transaction = database.transaction(GENERATED_CONTENT_STORE, 'readonly')
      const store = transaction.objectStore(GENERATED_CONTENT_STORE)
      const request = store.get(id)
      
      request.onsuccess = () => resolve(request.result?.content || null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function getCacheStats() {
  try {
    const database = await openDB()
    
    return new Promise((resolve) => {
      const stats = {
        questions: 0,
        flashcards: 0,
        subjects: new Set(),
        years: new Set()
      }
      
      const transaction = database.transaction([QUESTIONS_STORE, FLASHCARDS_STORE], 'readonly')
      
      const questionsStore = transaction.objectStore(QUESTIONS_STORE)
      const questionsRequest = questionsStore.getAll()
      
      questionsRequest.onsuccess = () => {
        const results = questionsRequest.result || []
        results.forEach(r => {
          stats.questions += (r.questions?.length || 0)
          if (r.subject) stats.subjects.add(r.subject)
          if (r.year) stats.years.add(r.year)
        })
      }
      
      const flashcardsStore = transaction.objectStore(FLASHCARDS_STORE)
      const flashcardsRequest = flashcardsStore.count()
      
      flashcardsRequest.onsuccess = () => {
        stats.flashcards = flashcardsRequest.result || 0
      }
      
      transaction.oncomplete = () => {
        resolve({
          questions: stats.questions,
          flashcards: stats.flashcards,
          subjects: Array.from(stats.subjects),
          years: Array.from(stats.years)
        })
      }
      transaction.onerror = () => resolve({ questions: 0, flashcards: 0, subjects: [], years: [] })
    })
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
    } catch (error) {
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

export default {
  openDB,
  saveQuestionsToCache,
  getQuestionsFromCache,
  getAllCachedQuestions,
  saveFlashcard,
  getFlashcards,
  deleteFlashcard,
  updateFlashcardProgress,
  saveNovelContent,
  getNovelContent,
  getAllNovels,
  saveGeneratedContent,
  getGeneratedContent,
  getCacheStats,
  downloadQuestionsForOffline
}
