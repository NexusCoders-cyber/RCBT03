import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, RotateCcw, ChevronLeft, ChevronRight, Plus, 
  Check, Trash2, Shuffle, BookOpen, Sparkles, Brain,
  Loader2, Zap, ArrowLeft, Wand2
} from 'lucide-react'
import { 
  getFlashcards, 
  saveFlashcard, 
  deleteFlashcard,
  updateFlashcardProgress 
} from '../services/offlineStorage'
import { generateFlashcards } from '../services/aiService'
import { JAMB_SYLLABUS, getTopicsForSubject } from '../data/jambSyllabus'
import useStore from '../store/useStore'

export default function Flashcards({ isOpen, onClose }) {
  const { subjects, isOnline } = useStore()
  const [flashcards, setFlashcards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mode, setMode] = useState('browse')
  const [studyStats, setStudyStats] = useState({ correct: 0, incorrect: 0 })

  const loadFlashcards = useCallback(async () => {
    setIsLoading(true)
    try {
      const stored = await getFlashcards(selectedSubject?.id || null)
      setFlashcards(stored)
      setCurrentIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error('Failed to load flashcards:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSubject])

  useEffect(() => {
    if (isOpen) {
      loadFlashcards()
    }
  }, [isOpen, loadFlashcards])

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setFlashcards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const handleDelete = async (id) => {
    await deleteFlashcard(id)
    loadFlashcards()
  }

  const handleStudyResponse = async (correct) => {
    const card = flashcards[currentIndex]
    if (card) {
      await updateFlashcardProgress(card.id, correct)
    }
    
    setStudyStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1)
    }))
    
    if (currentIndex < flashcards.length - 1) {
      handleNext()
    } else {
      setMode('results')
    }
  }

  const startStudyMode = () => {
    if (flashcards.length === 0) {
      return
    }
    setMode('study')
    setStudyStats({ correct: 0, incorrect: 0 })
    handleShuffle()
  }

  const currentCard = flashcards[currentIndex]

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
        className="bg-slate-900 w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Flashcards</h2>
              <p className="text-sm text-slate-400">
                {flashcards.length} cards {selectedSubject ? `in ${selectedSubject.name}` : 'total'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'results' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Study Complete!</h3>
              <p className="text-slate-400 mb-6">You've reviewed all {flashcards.length} cards</p>
              
              <div className="flex justify-center gap-8 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{studyStats.correct}</p>
                  <p className="text-sm text-slate-400">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-400">{studyStats.incorrect}</p>
                  <p className="text-sm text-slate-400">Incorrect</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-400">
                    {flashcards.length > 0 ? Math.round((studyStats.correct / flashcards.length) * 100) : 0}%
                  </p>
                  <p className="text-sm text-slate-400">Accuracy</p>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setMode('browse')}
                  className="px-6 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
                >
                  Back to Browse
                </button>
                <button
                  onClick={startStudyMode}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:from-amber-400 hover:to-orange-500 transition-colors"
                >
                  Study Again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    !selectedSubject
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All
                </button>
                {subjects.slice(0, 8).map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedSubject?.id === subject.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{subject.icon}</span>
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : flashcards.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Flashcards Yet</h3>
                  <p className="text-slate-400 mb-6">Create flashcards manually or generate them with AI</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 rounded-xl bg-slate-700 text-white font-medium flex items-center gap-2 justify-center hover:bg-slate-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Create Manually
                    </button>
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      disabled={!isOnline}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium flex items-center gap-2 justify-center disabled:opacity-50"
                    >
                      <Wand2 className="w-5 h-5" />
                      Generate with AI
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">
                      Card {currentIndex + 1} of {flashcards.length}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowGenerateModal(true)}
                        disabled={!isOnline}
                        className="p-2 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50"
                        title="Generate with AI"
                      >
                        <Wand2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                        title="Create New"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleShuffle}
                        className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                        title="Shuffle"
                      >
                        <Shuffle className="w-5 h-5" />
                      </button>
                      {mode === 'browse' && (
                        <button
                          onClick={startStudyMode}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          Study
                        </button>
                      )}
                    </div>
                  </div>

                  <div 
                    className="flashcard min-h-[300px] cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <motion.div 
                      className="flashcard-inner"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 min-h-[300px] flex flex-col justify-center items-center text-center"
                        style={{ backfaceVisibility: 'hidden' }}>
                        {currentCard?.topic && (
                          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium mb-4">
                            {currentCard.topic}
                          </span>
                        )}
                        <p className="text-lg text-white font-medium leading-relaxed">
                          {currentCard?.front}
                        </p>
                        <p className="text-sm text-slate-400 mt-6 flex items-center gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Tap to flip
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-6 min-h-[300px] flex flex-col justify-center items-center text-center absolute inset-0"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <p className="text-lg text-white font-medium leading-relaxed whitespace-pre-wrap">
                          {currentCard?.back}
                        </p>
                        <p className="text-sm text-amber-200 mt-6 flex items-center gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Tap to flip back
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {mode === 'study' && isFlipped && (
                    <div className="flex justify-center gap-4 mt-6">
                      <button
                        onClick={() => handleStudyResponse(false)}
                        className="flex-1 py-4 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Didn't Know
                      </button>
                      <button
                        onClick={() => handleStudyResponse(true)}
                        className="flex-1 py-4 rounded-xl bg-green-600 text-white font-medium hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Got It!
                      </button>
                    </div>
                  )}

                  {mode === 'browse' && (
                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="p-3 rounded-xl bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      
                      {currentCard && (
                        <button
                          onClick={() => handleDelete(currentCard.id)}
                          className="p-3 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                          title="Delete Card"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={handleNext}
                        disabled={currentIndex >= flashcards.length - 1}
                        className="p-3 rounded-xl bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  )}

                  {mode === 'study' && (
                    <button
                      onClick={() => setMode('browse')}
                      className="mt-4 w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Exit Study Mode
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateFlashcardModal 
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={async (card) => {
              await saveFlashcard(card)
              loadFlashcards()
              setShowCreateModal(false)
            }}
            subjects={subjects}
            selectedSubject={selectedSubject}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGenerateModal && (
          <GenerateFlashcardsModal
            isOpen={showGenerateModal}
            onClose={() => setShowGenerateModal(false)}
            onGenerate={async (cards, subject, topic) => {
              for (const card of cards) {
                await saveFlashcard({
                  ...card,
                  subject: subject,
                  topic: topic,
                  source: 'ai'
                })
              }
              loadFlashcards()
              setShowGenerateModal(false)
            }}
            subjects={subjects}
            selectedSubject={selectedSubject}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CreateFlashcardModal({ isOpen, onClose, onSave, subjects, selectedSubject }) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subject, setSubject] = useState(selectedSubject?.id || 'english')
  const [topic, setTopic] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSave({
        front: front.trim(),
        back: back.trim(),
        subject,
        topic: topic.trim() || 'General',
        source: 'user'
      })
      setFront('')
      setBack('')
      setTopic('')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Create Flashcard</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Topic (optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Algebra, Grammar, Organic Chemistry"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Front (Question)
            </label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the question or prompt..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Back (Answer)
            </label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the answer or explanation..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!front.trim() || !back.trim() || isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Flashcard
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

function GenerateFlashcardsModal({ isOpen, onClose, onGenerate, subjects, selectedSubject }) {
  const [subject, setSubject] = useState(selectedSubject?.id || 'english')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const topics = getTopicsForSubject(subject)

  const handleGenerate = async () => {
    if (!topic) {
      setError('Please select a topic')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const subjectName = subjects.find(s => s.id === subject)?.name || subject
      const cards = await generateFlashcards(subjectName, topic, count)
      
      if (cards && cards.length > 0) {
        await onGenerate(cards, subject, topic)
      } else {
        setError('Failed to generate flashcards. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to generate flashcards')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Generate Flashcards</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-400">
            AI will generate flashcards based on the JAMB syllabus for your selected topic.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value)
                setTopic('')
              }}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Topic (from JAMB Syllabus)
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="">Select a topic...</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Number of Cards
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value={3}>3 cards</option>
              <option value={5}>5 cards</option>
              <option value={10}>10 cards</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-lg">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!topic || isGenerating}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Flashcards
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
