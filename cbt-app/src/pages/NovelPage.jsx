import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, BookOpen, Users, Lightbulb, ChevronRight, 
  ChevronDown, Play, Brain, Sparkles, Quote, Layers,
  Plus, Loader2, Wand2, RefreshCw
} from 'lucide-react'
import { getAllNovels, saveNovelContent } from '../services/offlineStorage'
import { generateNovelAnalysis } from '../services/aiService'
import useStore from '../store/useStore'

const DEFAULT_NOVEL = {
  id: 'default-novel',
  title: 'Add a Novel',
  author: 'Use AI to generate study content',
  yearPublished: '',
  genre: 'Literature',
  description: 'Click "Generate Novel Analysis" to create study materials for any JAMB literature text using AI.',
  summary: 'This feature allows you to generate comprehensive study materials for any novel on the JAMB Literature syllabus. The AI will create:\n\n• A detailed plot summary\n• Chapter-by-chapter analysis\n• Character profiles and relationships\n• Themes and their explanations\n• Literary devices used\n• Practice questions\n\nSimply enter the novel title and author, and the AI will generate everything you need for exam preparation.',
  chapters: [],
  characters: [],
  themes: [],
  literaryDevices: [],
  questions: []
}

export default function NovelPage() {
  const navigate = useNavigate()
  const { startPracticeMode, addNotification, isOnline } = useStore()
  const [activeTab, setActiveTab] = useState('summary')
  const [expandedChapter, setExpandedChapter] = useState(null)
  const [novels, setNovels] = useState([])
  const [selectedNovel, setSelectedNovel] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadNovels()
  }, [])

  const loadNovels = async () => {
    setIsLoading(true)
    try {
      const savedNovels = await getAllNovels()
      setNovels(savedNovels)
      if (savedNovels.length > 0) {
        setSelectedNovel(savedNovels[0])
      } else {
        setSelectedNovel(DEFAULT_NOVEL)
      }
    } catch (error) {
      console.error('Failed to load novels:', error)
      setSelectedNovel(DEFAULT_NOVEL)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateNovel = async (title, author) => {
    if (!isOnline) {
      addNotification({
        type: 'error',
        title: 'Offline',
        message: 'You need an internet connection to generate novel analysis.'
      })
      return
    }

    setIsGenerating(true)
    try {
      const novelData = await generateNovelAnalysis(title, author)
      if (novelData) {
        const sanitizedNovel = {
          id: `novel-${Date.now()}`,
          title: novelData.title || title,
          author: novelData.author || author,
          genre: novelData.genre || 'Literature',
          yearPublished: novelData.yearPublished || '',
          description: novelData.description || `A literary analysis of ${title} by ${author}`,
          summary: novelData.summary || 'Summary not available.',
          chapters: Array.isArray(novelData.chapters) ? novelData.chapters : [],
          characters: Array.isArray(novelData.characters) ? novelData.characters : [],
          themes: Array.isArray(novelData.themes) ? novelData.themes : [],
          literaryDevices: Array.isArray(novelData.literaryDevices) ? novelData.literaryDevices : [],
          questions: Array.isArray(novelData.questions) ? novelData.questions : []
        }
        await saveNovelContent(sanitizedNovel)
        await loadNovels()
        setSelectedNovel(sanitizedNovel)
        setShowGenerateModal(false)
        addNotification({
          type: 'success',
          title: 'Success',
          message: `Novel analysis for "${title}" has been generated and saved!`
        })
      } else {
        throw new Error('Failed to generate novel analysis')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: error.message || 'Could not generate novel analysis. Please try again.'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePracticeNovel = () => {
    if (!selectedNovel || !selectedNovel.questions || selectedNovel.questions.length === 0) {
      addNotification({
        type: 'error',
        title: 'No Questions',
        message: 'No practice questions available for this novel. Generate a novel analysis first.'
      })
      return
    }

    const formattedQuestions = selectedNovel.questions.map((q, idx) => ({
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

  const novel = selectedNovel || DEFAULT_NOVEL

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BookOpen },
    { id: 'chapters', label: 'Chapters', icon: Layers },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'themes', label: 'Themes', icon: Lightbulb },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

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
              <p className="text-slate-400 text-sm">AI-powered study guide</p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors"
              title="Generate new novel analysis"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          {novels.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {novels.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNovel(n)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedNovel?.id === n.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {n.title}
                </button>
              ))}
            </div>
          )}

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
              {novel.questions?.length > 0 ? (
                <button
                  onClick={handlePracticeNovel}
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium flex items-center justify-center gap-2 hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  Practice Questions ({novel.questions.length})
                </button>
              ) : (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium flex items-center justify-center gap-2 hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate Novel Analysis
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 px-6 rounded-xl bg-slate-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <Brain className="w-5 h-5" />
                Back to Dashboard
              </button>
            </div>
          </div>

          {novel.chapters?.length > 0 && (
            <>
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
            </>
          )}

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
                    Use AI to generate flashcards for memorizing key quotes and events
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showGenerateModal && (
          <GenerateNovelModal
            isOpen={showGenerateModal}
            onClose={() => setShowGenerateModal(false)}
            onGenerate={handleGenerateNovel}
            isGenerating={isGenerating}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function GenerateNovelModal({ isOpen, onClose, onGenerate, isGenerating }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (title.trim() && author.trim()) {
      onGenerate(title.trim(), author.trim())
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Generate Novel Analysis</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-slate-400">
            Enter the novel title and author from the JAMB Literature syllabus. AI will generate comprehensive study materials.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Novel Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Life Changer"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
              required
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g., Khadija Abubakar Jalli"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
              required
              disabled={isGenerating}
            />
          </div>

          <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-800/50">
            <p className="text-xs text-purple-300">
              <strong>This will generate:</strong> Plot summary, chapter analysis, character profiles, themes, literary devices, and 10+ practice questions.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !author.trim() || isGenerating}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium hover:from-purple-500 hover:to-violet-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
