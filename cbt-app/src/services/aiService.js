import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const POE_API_KEY = import.meta.env.VITE_POE_API_KEY || ''
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || ''
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY || ''

const DB_NAME = 'jamb-cbt-offline'
const DB_VERSION = 5
const AI_CACHE_STORE = 'ai_cache'
const AI_HISTORY_STORE = 'ai_history'
const AI_SETTINGS_STORE = 'ai_settings'

let db = null
let genAI = null
let chatSession = null
let conversationHistory = []
let currentProvider = 'gemini'
let currentModel = 'gemini-1.5-flash'

export const AI_PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    color: 'from-blue-500 to-purple-600',
    description: 'Google\'s most capable AI model',
    models: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Best free tier (1500/day)', tier: 'standard' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest & fastest', tier: 'premium' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced reasoning', tier: 'pro' },
    ],
    available: !!GEMINI_API_KEY
  },
  poe: {
    id: 'poe',
    name: 'Poe AI',
    icon: '🤖',
    color: 'from-green-500 to-teal-600',
    description: 'Access multiple AI models via Poe',
    models: [
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast & accurate', tier: 'standard' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced', tier: 'pro' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI compact', tier: 'standard' },
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Google via Poe', tier: 'standard' },
    ],
    available: !!POE_API_KEY
  },
  grok: {
    id: 'grok',
    name: 'Grok AI',
    icon: '🚀',
    color: 'from-orange-500 to-red-600',
    description: 'xAI\'s conversational model',
    models: [
      { id: 'grok-beta', name: 'Grok Beta', description: 'Latest Grok model', tier: 'standard' },
      { id: 'grok-2', name: 'Grok 2', description: 'Enhanced capabilities', tier: 'pro' },
    ],
    available: !!GROK_API_KEY
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras AI',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-600',
    description: 'Ultra-fast inference',
    models: [
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', description: 'High performance', tier: 'pro' },
      { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', description: 'Fast & efficient', tier: 'standard' },
    ],
    available: !!CEREBRAS_API_KEY
  }
}

function getGenAI() {
  if (!genAI && GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  }
  return genAI
}

async function openDB() {
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
      if (!database.objectStoreNames.contains('questions')) {
        database.createObjectStore('questions', { keyPath: 'cacheKey' })
      }
      if (!database.objectStoreNames.contains(AI_CACHE_STORE)) {
        database.createObjectStore(AI_CACHE_STORE, { keyPath: 'cacheKey' })
      }
      if (!database.objectStoreNames.contains(AI_HISTORY_STORE)) {
        database.createObjectStore(AI_HISTORY_STORE, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(AI_SETTINGS_STORE)) {
        database.createObjectStore(AI_SETTINGS_STORE, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('flashcards')) {
        const store = database.createObjectStore('flashcards', { keyPath: 'id' })
        store.createIndex('subject', 'subject', { unique: false })
        store.createIndex('topic', 'topic', { unique: false })
      }
      if (!database.objectStoreNames.contains('novel')) {
        database.createObjectStore('novel', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('generated_content')) {
        database.createObjectStore('generated_content', { keyPath: 'id' })
      }
    }
  })
}

export async function getAISettings() {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const transaction = database.transaction(AI_SETTINGS_STORE, 'readonly')
      const store = transaction.objectStore(AI_SETTINGS_STORE)
      const request = store.get('current_settings')
      
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          currentProvider = result.provider || 'gemini'
          currentModel = result.model || 'gemini-1.5-flash'
          resolve(result)
        } else {
          resolve({ provider: 'gemini', model: 'gemini-1.5-flash' })
        }
      }
      request.onerror = () => resolve({ provider: 'gemini', model: 'gemini-1.5-flash' })
    })
  } catch {
    return { provider: 'gemini', model: 'gemini-1.5-flash' }
  }
}

export async function saveAISettings(provider, model) {
  try {
    currentProvider = provider
    currentModel = model
    chatSession = null
    
    const database = await openDB()
    return new Promise((resolve) => {
      const transaction = database.transaction(AI_SETTINGS_STORE, 'readwrite')
      const store = transaction.objectStore(AI_SETTINGS_STORE)
      store.put({ 
        id: 'current_settings', 
        provider, 
        model,
        updatedAt: Date.now() 
      })
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

async function getCachedResponse(cacheKey) {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const transaction = database.transaction(AI_CACHE_STORE, 'readonly')
      const store = transaction.objectStore(AI_CACHE_STORE)
      const request = store.get(cacheKey)
      
      request.onsuccess = () => {
        const result = request.result
        if (result && result.response) {
          const cacheAge = Date.now() - result.timestamp
          if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
            resolve(result.response)
            return
          }
        }
        resolve(null)
      }
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function cacheResponse(cacheKey, response) {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const transaction = database.transaction(AI_CACHE_STORE, 'readwrite')
      const store = transaction.objectStore(AI_CACHE_STORE)
      store.put({ cacheKey, response, timestamp: Date.now() })
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

export async function saveConversationHistory(history) {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const transaction = database.transaction(AI_HISTORY_STORE, 'readwrite')
      const store = transaction.objectStore(AI_HISTORY_STORE)
      store.put({ 
        id: 'main_conversation', 
        history: history.slice(-50),
        timestamp: Date.now() 
      })
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

export async function loadConversationHistory() {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const transaction = database.transaction(AI_HISTORY_STORE, 'readonly')
      const store = transaction.objectStore(AI_HISTORY_STORE)
      const request = store.get('main_conversation')
      
      request.onsuccess = () => {
        const result = request.result
        if (result && result.history) {
          resolve(result.history)
        } else {
          resolve([])
        }
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function clearConversationHistory() {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const transaction = database.transaction(AI_HISTORY_STORE, 'readwrite')
      const store = transaction.objectStore(AI_HISTORY_STORE)
      store.delete('main_conversation')
      transaction.oncomplete = () => {
        conversationHistory = []
        chatSession = null
        resolve(true)
      }
      transaction.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

const SYSTEM_INSTRUCTION = `You are Ilom, an expert educational AI assistant for a JAMB CBT (Computer-Based Test) practice application. Your role is to help Nigerian students prepare for their JAMB UTME examinations.

Your responsibilities:
1. Explain concepts from JAMB subjects (English, Mathematics, Physics, Chemistry, Biology, Literature, Government, Commerce, Accounting, Economics, CRK, IRK, Geography, Agricultural Science, History)
2. Help students understand difficult topics and questions
3. Provide clear, concise explanations suitable for secondary school students
4. Give study tips and exam strategies
5. Break down complex problems step by step
6. Relate concepts to everyday examples students can understand
7. When shown images, analyze diagrams, graphs, charts, or question images to help explain concepts

Guidelines:
- Keep explanations clear and educational
- Use simple language appropriate for Nigerian secondary school students
- When explaining math/physics, show step-by-step solutions
- Encourage students and be supportive
- Focus only on educational content related to JAMB subjects
- If asked about non-educational topics, politely redirect to study-related matters
- Be culturally aware and use examples relevant to Nigerian students
- Format your responses with clear sections using bullet points or numbered lists when appropriate
- Always end explanations with a brief "Key Takeaway" or "Remember" section to reinforce learning

Remember: You are here to help students learn and succeed in their JAMB examinations.`

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withRetry(fn, maxRetries = 3) {
  let lastError
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const errorMessage = error.message || ''
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate')) {
        const waitTime = Math.pow(2, attempt + 1) * 1000
        await sleep(waitTime)
        continue
      }
      throw error
    }
  }
  if (lastError?.message?.includes('429') || lastError?.message?.includes('quota')) {
    throw new Error('You have reached the API rate limit. Please wait a moment and try again, or switch to Gemini 1.5 Flash for higher limits.')
  }
  throw lastError
}

async function callGeminiAPI(prompt, imageData = null) {
  const ai = getGenAI()
  if (!ai) {
    throw new Error('Gemini API is not configured. Please add your API key.')
  }

  const model = ai.getGenerativeModel({ 
    model: currentModel,
    systemInstruction: SYSTEM_INSTRUCTION
  })

  if (imageData) {
    return withRetry(async () => {
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: imageData.split(';')[0].split(':')[1]
        }
      }
      const result = await model.generateContent([prompt, imagePart])
      return result.response.text()
    })
  }

  if (!chatSession) {
    const savedHistory = await loadConversationHistory()
    conversationHistory = savedHistory
    
    const formattedHistory = savedHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
    
    chatSession = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      }
    })
  }

  return withRetry(async () => {
    const result = await chatSession.sendMessage(prompt)
    const response = result.response.text()
    
    conversationHistory.push({ role: 'user', content: prompt })
    conversationHistory.push({ role: 'assistant', content: response })
    await saveConversationHistory(conversationHistory)
    
    return response
  })
}

async function callPoeAPI(prompt) {
  if (!POE_API_KEY) {
    throw new Error('Poe API is not configured. Please add your API key.')
  }

  const response = await fetch('https://api.poe.com/bot/' + currentModel, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: [{
        role: 'system',
        content: SYSTEM_INSTRUCTION
      }, {
        role: 'user', 
        content: prompt
      }],
      temperature: 0.7,
    })
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Poe API request failed')
  }

  const data = await response.json()
  return data.text || data.response || 'No response received'
}

async function callGrokAPI(prompt) {
  if (!GROK_API_KEY) {
    throw new Error('Grok API is not configured. Please add your API key.')
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: currentModel,
      messages: [{
        role: 'system',
        content: SYSTEM_INSTRUCTION
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
    })
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error?.message || 'Grok API request failed')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response received'
}

async function callCerebrasAPI(prompt) {
  if (!CEREBRAS_API_KEY) {
    throw new Error('Cerebras API is not configured. Please add your API key.')
  }

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: currentModel,
      messages: [{
        role: 'system',
        content: SYSTEM_INSTRUCTION
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 2048,
    })
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error?.message || 'Cerebras API request failed')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response received'
}

async function callAIProvider(prompt, imageData = null) {
  await getAISettings()
  
  switch (currentProvider) {
    case 'gemini':
      return callGeminiAPI(prompt, imageData)
    case 'poe':
      if (imageData) {
        throw new Error('Image analysis is only available with Gemini. Please switch to Gemini for image features.')
      }
      return callPoeAPI(prompt)
    case 'grok':
      if (imageData) {
        throw new Error('Image analysis is only available with Gemini. Please switch to Gemini for image features.')
      }
      return callGrokAPI(prompt)
    case 'cerebras':
      if (imageData) {
        throw new Error('Image analysis is only available with Gemini. Please switch to Gemini for image features.')
      }
      return callCerebrasAPI(prompt)
    default:
      return callGeminiAPI(prompt, imageData)
  }
}

export async function askAI(question, subject = null, context = null, imageData = null) {
  const cacheKey = `ai-${question.substring(0, 50)}-${subject || 'general'}-${currentProvider}-${currentModel}`
  
  if (!imageData) {
    const cached = await getCachedResponse(cacheKey)
    if (cached) {
      return cached
    }
  }
  
  if (!navigator.onLine) {
    throw new Error('You are offline. AI assistance requires an internet connection.')
  }
  
  let userMessage = question
  if (subject) {
    userMessage = `[Subject: ${subject}] ${question}`
  }
  if (context) {
    userMessage = `Context: ${context}\n\nQuestion: ${question}`
  }
  
  try {
    const response = await callAIProvider(userMessage, imageData)
    
    if (!imageData) {
      await cacheResponse(cacheKey, response)
    }
    
    return response
  } catch (error) {
    if (error.message.includes('offline')) {
      throw error
    }
    console.error('AI Error:', error)
    throw new Error(`AI service error: ${error.message}`)
  }
}

export async function explainQuestion(question, options, correctAnswer, subject) {
  const optionsText = Object.entries(options)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
    .join('\n')
  
  const prompt = `Please explain this JAMB ${subject} question and why option "${correctAnswer.toUpperCase()}" is the correct answer:

Question: ${question}

Options:
${optionsText}

Correct Answer: ${correctAnswer.toUpperCase()}

Please provide:
1. **Concept Overview**: A clear explanation of the concept being tested
2. **Why the Correct Answer**: Detailed explanation of why option ${correctAnswer.toUpperCase()} is right
3. **Why Others are Wrong**: Brief explanation of why each other option is incorrect
4. **Study Tips**: Tips for remembering this type of question

---
**Key Takeaway**: Summarize the most important point to remember.`

  return askAI(prompt, subject)
}

export async function getStudyTips(subject) {
  const prompt = `Give me 5 effective study tips specifically for preparing for JAMB ${subject}. 

For each tip:
- Explain the strategy clearly
- Give a practical example of how to apply it
- Mention how it helps in the actual exam

Format your response with numbered tips and clear explanations.

End with a motivational note for students.`
  return askAI(prompt, subject)
}

export async function clarifyTopic(topic, subject) {
  const prompt = `Please explain the topic "${topic}" in ${subject} in a way that a Nigerian secondary school student preparing for JAMB would understand.

Structure your explanation as:
1. **What is it?**: Simple definition
2. **Key Points**: Main concepts to understand (use bullet points)
3. **Examples**: Real-world examples relevant to Nigerian students
4. **Common Exam Questions**: Types of questions asked about this topic in JAMB
5. **Quick Memory Tips**: Easy ways to remember the key points

---
**Remember**: The most important thing to know about ${topic} is...`
  return askAI(prompt, subject)
}

export async function analyzeImage(imageData, question, subject = null) {
  const prompt = question || `Please analyze this image and explain what it shows. If it's a diagram, graph, or question from a JAMB exam, provide a detailed explanation that would help a student understand it.`
  return askAI(prompt, subject, null, imageData)
}

export async function generateFlashcards(subject, topic, count = 5) {
  const prompt = `Generate ${count} flashcards for the JAMB ${subject} topic: "${topic}".

For each flashcard, provide:
1. A clear question or prompt (front of card)
2. A concise but complete answer (back of card)

Format your response as a JSON array like this:
[
  {"front": "Question here?", "back": "Answer here"},
  {"front": "Question here?", "back": "Answer here"}
]

Make the flashcards focus on key concepts that are commonly tested in JAMB exams.
Only output the JSON array, no other text.`

  const response = await askAI(prompt, subject)
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    console.error('Failed to parse flashcards response')
  }
  
  return []
}

export async function generateNovelAnalysis(novelTitle, author) {
  const prompt = `Generate a comprehensive literary analysis for the novel "${novelTitle}" by ${author} for JAMB Literature students.

Please provide the analysis in the following JSON format:
{
  "id": "novel-id",
  "title": "${novelTitle}",
  "author": "${author}",
  "summary": "A detailed plot summary (300-500 words)",
  "chapters": [
    {"number": 1, "title": "Chapter Title", "summary": "Chapter summary"},
    ...
  ],
  "characters": [
    {"name": "Character Name", "role": "Role in story", "description": "Character description"},
    ...
  ],
  "themes": [
    {"theme": "Theme Name", "explanation": "Explanation of theme"},
    ...
  ],
  "literaryDevices": [
    {"device": "Device Name", "examples": "Examples from the novel"},
    ...
  ],
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": {"a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D"},
      "answer": "correct option letter",
      "explanation": "Why this answer is correct"
    },
    ...
  ]
}

Generate at least 5 main characters, 5 themes, 4 literary devices, and 10 practice questions.
Only output the JSON, no other text.`

  const response = await askAI(prompt, 'Literature')
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    console.error('Failed to parse novel analysis response')
  }
  
  return null
}

export function getConversationHistory() {
  return [...conversationHistory]
}

export async function resetChatSession() {
  chatSession = null
  await clearConversationHistory()
}

export function getAvailableProviders() {
  return Object.values(AI_PROVIDERS).filter(p => p.available)
}

export function getCurrentSettings() {
  return { provider: currentProvider, model: currentModel }
}

export default {
  askAI,
  explainQuestion,
  getStudyTips,
  clarifyTopic,
  analyzeImage,
  generateFlashcards,
  generateNovelAnalysis,
  getConversationHistory,
  resetChatSession,
  loadConversationHistory,
  saveConversationHistory,
  clearConversationHistory,
  getAISettings,
  saveAISettings,
  getAvailableProviders,
  getCurrentSettings,
  AI_PROVIDERS
}
