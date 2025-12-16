import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, BookOpen, Users, Lightbulb, ChevronRight, 
  ChevronDown, Play, Brain, Sparkles, Quote, Layers
} from 'lucide-react'
import useStore from '../store/useStore'
import { LEKKI_HEADMASTER_NOVEL } from '../data/lekkiHeadmaster'

export default function NovelPage() {
  const navigate = useNavigate()
  const { startPracticeMode, addNotification } = useStore()
  const [activeTab, setActiveTab] = useState('summary')
  const [expandedChapter, setExpandedChapter] = useState(null)

  const novel = LEKKI_HEADMASTER_NOVEL

  const handlePracticeNovel = () => {
    if (!novel.questions || novel.questions.length === 0) {
      addNotification({
        type: 'error',
        title: 'No Questions',
        message: 'No practice questions available for this novel.'
      })
      return
    }

    const formattedQuestions = novel.questions.map((q, idx) => ({
      ...q,
      id: q.id || `novel-q-${idx}`,
      subject: 'literature',
      examtype: 'JAMB',
      examyear: '2024',
      options: q.options || {},
      answer: q.answer?.toLowerCase() || 'a'
    }))

    startPracticeMode(
      { id: 'literature', name: 'Literature', icon: '📖', color: '#A855F7' },
      null,
      formattedQuestions,
      0
    )
    
    navigate('/exam')
  }

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BookOpen },
    { id: 'chapters', label: 'Chapters', icon: Layers },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'themes', label: 'Themes', icon: Lightbulb },
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">JAMB Literature Novel</h1>
              <p className="text-slate-400 text-sm">The Lekki Headmaster - Study Guide</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-violet-900/40 rounded-2xl p-6 border border-purple-700/50">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0 w-32 h-44 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-xl">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{novel.title}</h2>
                <p className="text-purple-300 mb-2">by {novel.author}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {novel.genre && (
                    <span className="px-3 py-1 rounded-full bg-purple-800/50 text-purple-200 text-xs font-medium">
                      {novel.genre}
                    </span>
                  )}
                  {novel.yearPublished && (
                    <span className="px-3 py-1 rounded-full bg-purple-800/50 text-purple-200 text-xs font-medium">
                      {novel.yearPublished}
                    </span>
                  )}
                  {novel.chapters?.length > 0 && (
                    <span className="px-3 py-1 rounded-full bg-purple-800/50 text-purple-200 text-xs font-medium">
                      {novel.chapters.length} Chapters
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {novel.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handlePracticeNovel}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium flex items-center justify-center gap-2 hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg"
              >
                <Play className="w-5 h-5" />
                Practice Questions ({novel.questions?.length || 0})
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 px-6 rounded-xl bg-slate-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <Brain className="w-5 h-5" />
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  Plot Summary
                </h3>
                <div className="prose prose-invert max-w-none">
                  {novel.summary?.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-slate-300 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'chapters' && (
              <motion.div
                key="chapters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {novel.chapters?.map((chapter) => (
                  <div 
                    key={chapter.number}
                    className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedChapter(expandedChapter === chapter.number ? null : chapter.number)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 rounded-xl bg-purple-900/50 text-purple-400 font-bold flex items-center justify-center">
                          {chapter.number}
                        </span>
                        <span className="font-medium text-white">{chapter.title}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${
                        expandedChapter === chapter.number ? 'rotate-180' : ''
                      }`} />
                    </button>
                    <AnimatePresence>
                      {expandedChapter === chapter.number && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-slate-300 leading-relaxed pl-14">
                              {chapter.summary}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'characters' && (
              <motion.div
                key="characters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                {novel.characters?.map((character, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-800 rounded-2xl p-5 border border-slate-700"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {character.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white">{character.name}</h4>
                        <p className="text-sm text-purple-400 mb-2">{character.role}</p>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {character.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'themes' && (
              <motion.div
                key="themes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {novel.themes?.length > 0 && (
                  <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      Major Themes
                    </h3>
                    <div className="space-y-4">
                      {novel.themes.map((theme, idx) => (
                        <div key={idx} className="pl-4 border-l-2 border-purple-600">
                          <h4 className="font-semibold text-purple-300 mb-1">{theme.theme}</h4>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {theme.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {novel.literaryDevices?.length > 0 && (
                  <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Literary Devices
                    </h3>
                    <div className="space-y-4">
                      {novel.literaryDevices.map((device, idx) => (
                        <div key={idx} className="pl-4 border-l-2 border-amber-600">
                          <h4 className="font-semibold text-amber-300 mb-1">{device.device}</h4>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {device.examples}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-2xl p-6 border border-emerald-800/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Quote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Study Tips</h3>
                <ul className="text-slate-300 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Focus on understanding character motivations and how they drive the plot
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Identify literary devices and be able to explain their effects
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Connect themes to real-life Nigerian educational context
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Practice with the questions to test your understanding
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
