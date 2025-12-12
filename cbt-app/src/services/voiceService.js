let speechSynthesis = null
let currentUtterance = null
let isReading = false

function initSpeechSynthesis() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    speechSynthesis = window.speechSynthesis
  }
  return speechSynthesis !== null
}

function stripHTML(html) {
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent || temp.innerText || ''
}

function getPreferredVoice() {
  if (!speechSynthesis) return null
  
  const voices = speechSynthesis.getVoices()
  
  const englishVoices = voices.filter(voice => 
    voice.lang.startsWith('en') && 
    (voice.lang.includes('NG') || voice.lang.includes('GB') || voice.lang.includes('US'))
  )
  
  if (englishVoices.length > 0) {
    const ngVoice = englishVoices.find(v => v.lang.includes('NG'))
    if (ngVoice) return ngVoice
    
    const gbVoice = englishVoices.find(v => v.lang.includes('GB'))
    if (gbVoice) return gbVoice
    
    return englishVoices[0]
  }
  
  const anyEnglish = voices.find(v => v.lang.startsWith('en'))
  return anyEnglish || voices[0] || null
}

export function isVoiceAvailable() {
  if (!initSpeechSynthesis()) return false
  return true
}

export function stopReading() {
  if (speechSynthesis) {
    speechSynthesis.cancel()
    isReading = false
    currentUtterance = null
  }
}

export function pauseReading() {
  if (speechSynthesis && isReading) {
    speechSynthesis.pause()
  }
}

export function resumeReading() {
  if (speechSynthesis && isReading) {
    speechSynthesis.resume()
  }
}

export function getIsReading() {
  return isReading
}

export function readText(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!initSpeechSynthesis()) {
      reject(new Error('Speech synthesis not available'))
      return
    }
    
    stopReading()
    
    const cleanText = stripHTML(text)
    
    if (!cleanText.trim()) {
      resolve()
      return
    }
    
    currentUtterance = new SpeechSynthesisUtterance(cleanText)
    
    const voice = getPreferredVoice()
    if (voice) {
      currentUtterance.voice = voice
    }
    
    currentUtterance.rate = options.rate || 0.9
    currentUtterance.pitch = options.pitch || 1
    currentUtterance.volume = options.volume || 1
    
    currentUtterance.onstart = () => {
      isReading = true
      if (options.onStart) options.onStart()
    }
    
    currentUtterance.onend = () => {
      isReading = false
      currentUtterance = null
      if (options.onEnd) options.onEnd()
      resolve()
    }
    
    currentUtterance.onerror = (event) => {
      isReading = false
      currentUtterance = null
      if (event.error !== 'canceled') {
        if (options.onError) options.onError(event)
        reject(new Error(`Speech error: ${event.error}`))
      } else {
        resolve()
      }
    }
    
    speechSynthesis.speak(currentUtterance)
  })
}

export async function readQuestion(question, options = {}) {
  if (!question) return
  
  const questionText = stripHTML(question.question)
  
  const optionTexts = Object.entries(question.options || {})
    .filter(([_, value]) => value)
    .map(([key, value]) => `Option ${key.toUpperCase()}: ${stripHTML(value)}`)
    .join('. ')
  
  const fullText = `Question: ${questionText}. ${optionTexts}`
  
  return readText(fullText, options)
}

export async function readQuestionOnly(questionText, options = {}) {
  if (!questionText) return
  
  const cleanText = stripHTML(questionText)
  return readText(`Question: ${cleanText}`, options)
}

export async function readOption(key, value, options = {}) {
  if (!value) return
  
  const cleanValue = stripHTML(value)
  return readText(`Option ${key.toUpperCase()}: ${cleanValue}`, options)
}

export async function readExplanation(explanation, options = {}) {
  if (!explanation) return
  
  const cleanText = stripHTML(explanation)
  return readText(`Explanation: ${cleanText}`, options)
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  })
}

export default {
  isVoiceAvailable,
  readText,
  readQuestion,
  readQuestionOnly,
  readOption,
  readExplanation,
  stopReading,
  pauseReading,
  resumeReading,
  getIsReading
}
