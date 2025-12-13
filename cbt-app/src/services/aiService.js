import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || ''
const POE_API_KEY = import.meta.env.VITE_POE_API_KEY || ''
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || ''
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY || ''

const getActiveProviders = () => {
  const providers = []
  if (GEMINI_API_KEY) providers.push('gemini')
  if (CEREBRAS_API_KEY) providers.push('cerebras')
  if (GROK_API_KEY) providers.push('grok')
  if (POE_API_KEY) providers.push('poe')
  return providers
}

export const hasAnyProvider = () => getActiveProviders().length > 0
export const getFirstAvailableProvider = () => getActiveProviders()[0] || 'gemini'

const DB_NAME = 'jamb-cbt-offline'
const DB_VERSION = 6
const AI_CACHE_STORE = 'ai_cache'
const AI_HISTORY_STORE = 'ai_history'
const AI_SETTINGS_STORE = 'ai_settings'

let db = null
let genAI = null
let chatSession = null
let conversationHistory = []
let currentProvider = 'auto'
let currentModel = 'auto'

export const AI_PROVIDERS = {
  auto: {
    id: 'auto',
    name: 'Auto Select',
    icon: '🎯',
    color: 'from-emerald-500 to-teal-600',
    description: 'Automatically selects the best available model',
    models: [
      { id: 'auto', name: 'Auto', description: 'Smart model selection based on question type', tier: 'auto' },
    ],
    available: true
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    color: 'from-blue-500 to-purple-600',
    description: 'Google\'s most capable AI model',
    models: [
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Free tier - fast responses', tier: 'standard', priority: 1 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest & fastest', tier: 'premium', priority: 2 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Reliable free tier', tier: 'standard', priority: 1 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced reasoning', tier: 'pro', priority: 3 },
    ],
    get available() { return !!GEMINI_API_KEY }
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras AI',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-600',
    description: 'Ultra-fast inference',
    models: [
      { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', description: 'Fast & efficient', tier: 'standard', priority: 1 },
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', description: 'High performance', tier: 'pro', priority: 2 },
    ],
    get available() { return !!CEREBRAS_API_KEY }
  },
  grok: {
    id: 'grok',
    name: 'Grok AI',
    icon: '🚀',
    color: 'from-orange-500 to-red-600',
    description: 'xAI\'s conversational model',
    models: [
      { id: 'grok-beta', name: 'Grok Beta', description: 'Latest Grok model', tier: 'standard', priority: 1 },
      { id: 'grok-2', name: 'Grok 2', description: 'Enhanced capabilities', tier: 'pro', priority: 2 },
    ],
    get available() { return !!GROK_API_KEY }
  },
  poe: {
    id: 'poe',
    name: 'Poe AI',
    icon: '🤖',
    color: 'from-green-500 to-teal-600',
    description: 'Access multiple AI models via Poe',
    models: [
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast & accurate', tier: 'standard', priority: 1 },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced', tier: 'pro', priority: 2 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI compact', tier: 'standard', priority: 1 },
    ],
    get available() { return !!POE_API_KEY }
  }
}

const PROMPT_CATEGORIES = {
  math: ['calculate', 'solve', 'equation', 'formula', 'mathematics', 'algebra', 'geometry', 'calculus', 'trigonometry', 'number'],
  science: ['physics', 'chemistry', 'biology', 'reaction', 'experiment', 'atom', 'molecule', 'cell', 'organism', 'force', 'energy'],
  literature: ['novel', 'poem', 'author', 'character', 'theme', 'literary', 'literature', 'prose', 'drama', 'poetry'],
  language: ['grammar', 'vocabulary', 'english', 'word', 'sentence', 'comprehension', 'passage'],
  image: ['image', 'diagram', 'picture', 'graph', 'chart', 'figure', 'analyze this', 'look at'],
  complex: ['explain', 'analyze', 'compare', 'contrast', 'evaluate', 'discuss', 'elaborate', 'in-depth'],
  simple: ['what is', 'define', 'meaning', 'quick', 'short', 'brief']
}

function analyzePrompt(prompt) {
  const lowerPrompt = prompt.toLowerCase()
  const analysis = {
    requiresVision: false,
    complexity: 'standard',
    category: 'general',
    preferredTier: 'standard'
  }
  
  for (const keyword of PROMPT_CATEGORIES.image) {
    if (lowerPrompt.includes(keyword)) {
      analysis.requiresVision = true
      break
    }
  }
  
  for (const keyword of PROMPT_CATEGORIES.complex) {
    if (lowerPrompt.includes(keyword)) {
      analysis.complexity = 'complex'
      analysis.preferredTier = 'pro'
      break
    }
  }
  
  if (analysis.complexity !== 'complex') {
    for (const keyword of PROMPT_CATEGORIES.simple) {
      if (lowerPrompt.includes(keyword)) {
        analysis.complexity = 'simple'
        break
      }
    }
  }
  
  for (const [category, keywords] of Object.entries(PROMPT_CATEGORIES)) {
    if (category === 'image' || category === 'complex' || category === 'simple') continue
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        analysis.category = category
        break
      }
    }
  }
  
  if (analysis.category === 'math' || analysis.category === 'science') {
    analysis.preferredTier = 'pro'
  }
  
  return analysis
}

function selectBestProvider(analysis, hasImage = false) {
  const availableProviders = []
  
  if (hasImage || analysis.requiresVision) {
    if (GEMINI_API_KEY) {
      return { provider: 'gemini', model: 'gemini-2.0-flash-lite' }
    }
    throw new Error('Image analysis requires Gemini API key. Please add your API key in Settings.')
  }
  
  if (GEMINI_API_KEY) {
    availableProviders.push({
      provider: 'gemini',
      model: analysis.preferredTier === 'pro' ? 'gemini-1.5-pro' : 'gemini-2.0-flash-lite',
      priority: 1
    })
  }
  
  if (CEREBRAS_API_KEY) {
    availableProviders.push({
      provider: 'cerebras',
      model: analysis.preferredTier === 'pro' ? 'llama-3.3-70b' : 'llama-3.1-8b',
      priority: 2
    })
  }
  
  if (GROK_API_KEY) {
    availableProviders.push({
      provider: 'grok',
      model: 'grok-beta',
      priority: 3
    })
  }
  
  if (POE_API_KEY) {
    availableProviders.push({
      provider: 'poe',
      model: analysis.preferredTier === 'pro' ? 'claude-3-sonnet' : 'claude-3-haiku',
      priority: 4
    })
  }
  
  if (availableProviders.length === 0) {
    throw new Error('No AI providers configured. Please add at least one API key in Settings.')
  }
  
  availableProviders.sort((a, b) => a.priority - b.priority)
  return availableProviders[0]
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
      if (!database.objectStoreNames.contains('offline_queue')) {
        database.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true })
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
          currentProvider = result.provider || 'auto'
          currentModel = result.model || 'auto'
          resolve(result)
        } else {
          resolve({ provider: 'auto', model: 'auto' })
        }
      }
      request.onerror = () => resolve({ provider: 'auto', model: 'auto' })
    })
  } catch {
    return { provider: 'auto', model: 'auto' }
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
    throw new Error('You have reached the API rate limit. Please wait a moment and try again.')
  }
  throw lastError
}

async function callGeminiAPI(prompt, model, imageData = null) {
  const ai = getGenAI()
  if (!ai) {
    throw new Error('Gemini API is not configured. Please add your API key.')
  }

  const geminiModel = ai.getGenerativeModel({ 
    model: model,
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
      const result = await geminiModel.generateContent([prompt, imagePart])
      return result.response.text()
    })
  }

  if (!chatSession || currentModel !== model) {
    const savedHistory = await loadConversationHistory()
    conversationHistory = savedHistory
    
    const formattedHistory = savedHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
    
    chatSession = geminiModel.startChat({
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

async function callPoeAPI(prompt, model) {
  if (!POE_API_KEY) {
    throw new Error('Poe API is not configured.')
  }

  const response = await fetch('https://api.poe.com/bot/' + model, {
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
    throw new Error('Poe API request failed')
  }

  const data = await response.json()
  return data.text || data.response || 'No response received'
}

async function callGrokAPI(prompt, model) {
  if (!GROK_API_KEY) {
    throw new Error('Grok API is not configured.')
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
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
    throw new Error('Grok API request failed')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response received'
}

async function callCerebrasAPI(prompt, model) {
  if (!CEREBRAS_API_KEY) {
    throw new Error('Cerebras API is not configured.')
  }

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
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
    throw new Error('Cerebras API request failed')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response received'
}

async function callAIProvider(prompt, provider, model, imageData = null) {
  switch (provider) {
    case 'gemini':
      return callGeminiAPI(prompt, model, imageData)
    case 'poe':
      return callPoeAPI(prompt, model)
    case 'grok':
      return callGrokAPI(prompt, model)
    case 'cerebras':
      return callCerebrasAPI(prompt, model)
    default:
      return callGeminiAPI(prompt, model, imageData)
  }
}

async function callWithFallback(prompt, imageData = null) {
  const analysis = analyzePrompt(prompt)
  const providers = []
  
  if (GEMINI_API_KEY) {
    providers.push({ provider: 'gemini', model: 'gemini-2.0-flash-lite' })
    providers.push({ provider: 'gemini', model: 'gemini-1.5-flash' })
  }
  if (CEREBRAS_API_KEY) {
    providers.push({ provider: 'cerebras', model: 'llama-3.1-8b' })
  }
  if (GROK_API_KEY) {
    providers.push({ provider: 'grok', model: 'grok-beta' })
  }
  if (POE_API_KEY) {
    providers.push({ provider: 'poe', model: 'claude-3-haiku' })
  }
  
  if (providers.length === 0) {
    throw new Error('No AI providers configured. Please add your Gemini API key to use AI features.')
  }
  
  let lastError = null
  for (const { provider, model } of providers) {
    try {
      if (imageData && provider !== 'gemini') continue
      return await callAIProvider(prompt, provider, model, imageData)
    } catch (error) {
      console.warn(`Provider ${provider}/${model} failed:`, error.message)
      lastError = error
      continue
    }
  }
  
  throw lastError || new Error('All AI providers failed. Please try again later.')
}

export async function askAI(question, subject = null, context = null, imageData = null) {
  const cacheKey = `ai-${question.substring(0, 50)}-${subject || 'general'}`
  
  if (!imageData) {
    const cached = await getCachedResponse(cacheKey)
    if (cached) {
      return cached
    }
  }
  
  if (!navigator.onLine) {
    const offlineResponse = getOfflineResponse(question, subject)
    if (offlineResponse) return offlineResponse
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
    await getAISettings()
    
    let response
    if (currentProvider === 'auto' || currentModel === 'auto') {
      response = await callWithFallback(userMessage, imageData)
    } else {
      response = await callAIProvider(userMessage, currentProvider, currentModel, imageData)
    }
    
    if (!imageData) {
      await cacheResponse(cacheKey, response)
    }
    
    return response
  } catch (error) {
    if (currentProvider !== 'auto') {
      try {
        const response = await callWithFallback(userMessage, imageData)
        if (!imageData) {
          await cacheResponse(cacheKey, response)
        }
        return response
      } catch {
      }
    }
    throw new Error(`AI service error: ${error.message}`)
  }
}

function getOfflineResponse(question, subject) {
  const lowerQ = question.toLowerCase()
  
  if (lowerQ.includes('what is') || lowerQ.includes('define')) {
    return `I'm currently offline and cannot provide AI assistance. However, here are some study tips for ${subject || 'this subject'}:

**Key Study Strategies:**
1. Review your textbook and class notes
2. Practice past JAMB questions
3. Use flashcards for key terms
4. Study in short, focused sessions

**Remember:** Consistent practice is key to JAMB success. Try again when you're online for detailed explanations.`
  }
  
  return null
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
  return Object.values(AI_PROVIDERS).filter(p => p.available || p.id === 'auto')
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
