import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Sun, Moon, Clock, Volume2, Vibrate, Calculator,
  Type, Trash2, AlertTriangle, Check, Info, Sparkles, Bot, Zap, ChevronRight
} from 'lucide-react'
import useStore from '../store/useStore'
import { AI_PROVIDERS, getAISettings, saveAISettings } from '../services/aiService'

export default function Settings() {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    timerEnabled,
    setTimerEnabled,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    calculatorEnabled,
    setCalculatorEnabled,
    practiceHistory,
    examHistory,
    clearAllData,
  } = useStore()

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearSuccess, setClearSuccess] = useState(false)
  const [currentProvider, setCurrentProvider] = useState('gemini')
  const [currentModel, setCurrentModel] = useState('gemini-2.0-flash')
  const [showAIConfig, setShowAIConfig] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getAISettings()
      setCurrentProvider(settings.provider)
      setCurrentModel(settings.model)
    }
    loadSettings()
  }, [])

  const handleClearData = () => {
    clearAllData()
    setShowClearConfirm(false)
    setClearSuccess(true)
    setTimeout(() => setClearSuccess(false), 3000)
  }

  const handleProviderChange = async (providerId, modelId) => {
    setCurrentProvider(providerId)
    setCurrentModel(modelId)
    await saveAISettings(providerId, modelId)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const totalSessions = practiceHistory.length + examHistory.length
  const availableProviders = Object.values(AI_PROVIDERS).filter(p => p.available)
  const currentProviderInfo = AI_PROVIDERS[currentProvider]
  const currentModelInfo = currentProviderInfo?.models.find(m => m.id === currentModel)

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-slate-400">Customize your experience</p>
            </div>
          </div>

          {clearSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-800 flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-emerald-400" />
              <p className="text-emerald-300">All data has been cleared successfully</p>
            </motion.div>
          )}

          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-800 flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-emerald-400" />
              <p className="text-emerald-300">AI model saved successfully</p>
            </motion.div>
          )}

          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                AI Assistant
              </h2>
              <button
                onClick={() => setShowAIConfig(!showAIConfig)}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Configure
                <ChevronRight className={`w-4 h-4 transition-transform ${showAIConfig ? 'rotate-90' : ''}`} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentProviderInfo?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-2xl`}>
                  {currentProviderInfo?.icon || '🤖'}
                </div>
                <div>
                  <p className="font-medium text-white">{currentProviderInfo?.name || 'AI'}</p>
                  <p className="text-sm text-slate-400">{currentModelInfo?.name || currentModel}</p>
                </div>
                {currentModelInfo?.tier === 'premium' && (
                  <span className="ml-auto px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Premium
                  </span>
                )}
                {currentModelInfo?.tier === 'pro' && (
                  <span className="ml-auto px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                    Pro
                  </span>
                )}
              </div>
            </div>

            {showAIConfig && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4"
              >
                {availableProviders.length > 0 ? (
                  availableProviders.map((provider) => (
                    <div key={provider.id} className="space-y-2">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${provider.color}`}>
                        <span className="text-lg">{provider.icon}</span>
                        <div>
                          <span className="text-sm font-semibold text-white">{provider.name}</span>
                          <p className="text-xs text-white/70">{provider.description}</p>
                        </div>
                      </div>
                      <div className="grid gap-2 pl-2">
                        {provider.models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => handleProviderChange(provider.id, model.id)}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                              currentProvider === provider.id && currentModel === model.id
                                ? 'bg-emerald-600/20 border-2 border-emerald-500/50'
                                : 'bg-slate-700/50 hover:bg-slate-700 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium text-white">{model.name}</span>
                              <span className="text-xs text-slate-400">{model.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {model.tier === 'premium' && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                </span>
                              )}
                              {model.tier === 'pro' && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                                  Pro
                                </span>
                              )}
                              {currentProvider === provider.id && currentModel === model.id && (
                                <Check className="w-5 h-5 text-emerald-400" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No AI providers configured</p>
                    <p className="text-xs mt-1">Add API keys to enable AI features</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Theme
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
                  ${theme === 'light'
                    ? 'border-emerald-500 bg-emerald-900/30'
                    : 'border-slate-600 hover:border-slate-500'
                  }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-white">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
                  ${theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-900/30'
                    : 'border-slate-600 hover:border-slate-500'
                  }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-white">Dark</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Type className="w-5 h-5" />
              Font Size
            </h2>
            <div className="flex gap-3">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
                    ${fontSize === size
                      ? 'border-emerald-500 bg-emerald-900/30'
                      : 'border-slate-600 hover:border-slate-500'
                    }`}
                >
                  <span className={`font-medium text-white
                    ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-base'}`}>
                    Aa
                  </span>
                  <span className="font-medium text-white capitalize text-sm">{size}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 space-y-4 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-2">Exam Settings</h2>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Timer</p>
                  <p className="text-sm text-slate-400">Show countdown timer during exams</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Calculator</p>
                  <p className="text-sm text-slate-400">Enable for calculation subjects</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={calculatorEnabled}
                  onChange={(e) => setCalculatorEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Sound</p>
                  <p className="text-sm text-slate-400">Play sounds for actions</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-900/50 flex items-center justify-center">
                  <Vibrate className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Vibration</p>
                  <p className="text-sm text-slate-400">Haptic feedback on mobile</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={(e) => setVibrationEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Data Management
            </h2>
            
            <div className="p-4 rounded-xl bg-slate-700/50 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Info className="w-5 h-5 text-blue-400" />
                <p className="font-medium text-white">Storage Info</p>
              </div>
              <p className="text-sm text-slate-400">
                You have <strong className="text-white">{totalSessions}</strong> exam sessions saved locally.
              </p>
            </div>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full p-4 rounded-xl border-2 border-red-800 bg-red-900/20 
                         text-red-300 font-medium hover:bg-red-900/40 
                         transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Clear All Data
            </button>
          </div>

          <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-2xl p-6 border border-slate-700">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              About JAMB CBT Practice
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              A modern CBT practice platform with AI-powered learning assistance. Practice JAMB questions 
              with official exam format, get AI explanations, and track your progress.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300">
                Version 2.1.0
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-400">
                Multi-AI Powered
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400">
                Works Offline
              </span>
            </div>
          </div>
        </motion.div>

        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Clear All Data?</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-slate-400 mb-6">
                This will permanently delete all your practice history, exam records, and saved progress. 
                Your settings will be reset to defaults.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
