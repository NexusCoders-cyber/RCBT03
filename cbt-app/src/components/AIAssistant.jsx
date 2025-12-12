import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Send, Bot, Loader2, Sparkles, 
  BookOpen, Lightbulb, Image, Trash2, Settings, ChevronDown, Check, Zap
} from 'lucide-react'
import { 
  askAI, 
  explainQuestion, 
  getStudyTips, 
  clarifyTopic,
  analyzeImage,
  loadConversationHistory,
  clearConversationHistory,
  AI_PROVIDERS,
  getAISettings,
  saveAISettings
} from '../services/aiService'
import useStore from '../store/useStore'

export default function AIAssistant({ isOpen, onClose, currentQuestion = null, currentSubject = null }) {
  const { isOnline } = useStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [currentProvider, setCurrentProvider] = useState('gemini')
  const [currentModel, setCurrentModel] = useState('gemini-2.0-flash')
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getAISettings()
      setCurrentProvider(settings.provider)
      setCurrentModel(settings.model)
    }
    loadSettings()
  }, [])

  useEffect(() => {
    const initializeChat = async () => {
      if (isOpen && messages.length === 0) {
        const savedHistory = await loadConversationHistory()
        if (savedHistory.length > 0) {
          setMessages(savedHistory)
        } else {
          const providerName = AI_PROVIDERS[currentProvider]?.name || 'AI'
          setMessages([{
            role: 'assistant',
            content: `Hello! I'm Ilom, your JAMB study assistant powered by ${providerName}. I can help you with:

• Explaining difficult concepts in any subject
• Breaking down JAMB questions step by step
• Providing personalized study tips
• Clarifying topics from the JAMB syllabus
• Analyzing images, diagrams, and graphs

I remember our previous conversations to better assist you. How can I help you prepare for your exams today?`
          }])
        }
      }
    }
    initializeChat()
  }, [isOpen, messages.length, currentProvider])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleProviderChange = async (providerId, modelId) => {
    setCurrentProvider(providerId)
    setCurrentModel(modelId)
    await saveAISettings(providerId, modelId)
    setShowModelSelector(false)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Image is too large. Please select an image smaller than 5MB.'
        }])
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result)
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return

    const userMessage = input.trim() || 'Please analyze this image and explain what it shows.'
    const hasImage = !!selectedImage
    
    setInput('')
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      image: imagePreview
    }])
    
    const imageToSend = selectedImage
    clearImage()
    setIsLoading(true)

    try {
      let response
      if (hasImage) {
        response = await analyzeImage(imageToSend, userMessage, currentSubject?.name)
      } else {
        response = await askAI(userMessage, currentSubject?.name)
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I couldn't process that request. ${error.message}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExplainQuestion = async () => {
    if (!currentQuestion || isLoading) return

    setIsLoading(true)
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: 'Please explain this question to me with a detailed breakdown.' 
    }])

    try {
      const response = await explainQuestion(
        currentQuestion.question,
        currentQuestion.options,
        currentQuestion.answer,
        currentSubject?.name || currentQuestion.subject || 'General'
      )
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I couldn't explain this question. ${error.message}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStudyTips = async () => {
    if (isLoading) return

    const subject = currentSubject?.name || 'General Studies'
    setIsLoading(true)
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: `Give me study tips for ${subject}` 
    }])

    try {
      const response = await getStudyTips(subject)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I couldn't get study tips. ${error.message}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = async () => {
    await clearConversationHistory()
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. I\'m Ilom - how can I help you with your JAMB preparation?'
    }])
  }

  const getProviderInfo = () => {
    const provider = AI_PROVIDERS[currentProvider]
    if (!provider) return { name: 'AI', icon: '🤖', model: '' }
    const model = provider.models.find(m => m.id === currentModel)
    return { 
      name: provider.name, 
      icon: provider.icon, 
      model: model?.name || currentModel,
      color: provider.color 
    }
  }

  const availableProviders = Object.values(AI_PROVIDERS).filter(p => p.available)

  if (!isOpen) return null

  const providerInfo = getProviderInfo()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl h-[85vh] sm:h-[600px] flex flex-col border border-slate-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-emerald-900/50 to-teal-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  Ilom
                  <span className="text-xs bg-emerald-600/30 text-emerald-400 px-2 py-0.5 rounded-full">AI</span>
                </h3>
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  <span>{providerInfo.icon}</span>
                  <span>{providerInfo.model}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showModelSelector && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-slate-700 overflow-hidden"
              >
                <div className="p-4 bg-slate-900/80 max-h-64 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">Select AI Model</span>
                  </div>
                  <div className="space-y-3">
                    {availableProviders.map((provider) => (
                      <div key={provider.id} className="space-y-2">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${provider.color} bg-opacity-20`}>
                          <span className="text-lg">{provider.icon}</span>
                          <span className="text-sm font-semibold text-white">{provider.name}</span>
                        </div>
                        <div className="grid gap-1.5 pl-2">
                          {provider.models.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => handleProviderChange(provider.id, model.id)}
                              className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                                currentProvider === provider.id && currentModel === model.id
                                  ? 'bg-emerald-600/20 border border-emerald-500/50'
                                  : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-medium text-white">{model.name}</span>
                                  <span className="text-xs text-slate-400">{model.description}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {model.tier === 'premium' && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Premium
                                  </span>
                                )}
                                {model.tier === 'pro' && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                                    Pro
                                  </span>
                                )}
                                {currentProvider === provider.id && currentModel === model.id && (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {availableProviders.length === 0 && (
                      <div className="text-center py-4 text-slate-400 text-sm">
                        No AI providers configured. Add API keys in settings.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {currentQuestion && (
            <div className="p-3 border-b border-slate-700 bg-slate-900/50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExplainQuestion}
                  disabled={isLoading || !isOnline}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-900/50 text-emerald-400 text-sm font-medium hover:bg-emerald-900/70 transition-colors disabled:opacity-50"
                >
                  <Lightbulb className="w-4 h-4" />
                  Explain Question
                </button>
                <button
                  onClick={handleStudyTips}
                  disabled={isLoading || !isOnline}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-900/50 text-blue-400 text-sm font-medium hover:bg-blue-900/70 transition-colors disabled:opacity-50"
                >
                  <BookOpen className="w-4 h-4" />
                  Study Tips
                </button>
              </div>
            </div>
          )}

          {!currentQuestion && (
            <div className="p-3 border-b border-slate-700 bg-slate-900/50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleStudyTips}
                  disabled={isLoading || !isOnline}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-900/50 text-blue-400 text-sm font-medium hover:bg-blue-900/70 transition-colors disabled:opacity-50"
                >
                  <BookOpen className="w-4 h-4" />
                  Study Tips
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-md'
                      : 'bg-slate-700 text-slate-100 rounded-bl-md'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Ilom</span>
                    </div>
                  )}
                  {message.image && (
                    <img 
                      src={message.image} 
                      alt="Uploaded" 
                      className="max-w-full h-auto rounded-lg mb-2 max-h-40 object-contain"
                    />
                  )}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                    {message.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-bold text-emerald-300 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
                      }
                      if (line.startsWith('---')) {
                        return <hr key={i} className="border-slate-600 my-3" />
                      }
                      if (line.match(/^\d+\./)) {
                        return <p key={i} className="ml-2 my-1">{line}</p>
                      }
                      if (line.startsWith('•') || line.startsWith('-')) {
                        return <p key={i} className="ml-4 my-1">{line}</p>
                      }
                      return <p key={i} className="my-1">{line}</p>
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 p-4 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span className="text-sm text-slate-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-700 bg-slate-900/50">
            {!isOnline && (
              <p className="text-xs text-amber-400 mb-2 text-center">
                You are offline. AI features require internet connection.
              </p>
            )}
            
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-20 w-auto rounded-lg border border-slate-600"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!isOnline || currentProvider !== 'gemini'}
                className="p-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors disabled:opacity-50"
                title={currentProvider !== 'gemini' ? 'Image analysis only available with Gemini' : 'Upload image'}
              >
                <Image className="w-5 h-5" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:border-emerald-500 focus:outline-none resize-none"
                rows={1}
                disabled={!isOnline}
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isLoading || !isOnline}
                className="p-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
