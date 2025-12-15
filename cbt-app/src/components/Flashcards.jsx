import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, RotateCcw, ChevronLeft, ChevronRight, Plus, 
  Check, Trash2, Shuffle, BookOpen, Sparkles, Brain,
  Loader2, Zap, ArrowLeft, Wand2, Target, TrendingUp,
  Clock, Award, ThumbsUp, ThumbsDown, Flame
} from 'lucide-react'
import { 
  getFlashcards, 
  saveFlashcard, 
  deleteFlashcard,
  updateFlashcardProgress,
  getFlashcardsForReview,
  getFlashcardStats
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
  const [mode, setMode] = useState('dashboard')
  const [studyStats, setStudyStats] = useState({ correct: 0, incorrect: 0, easy: 0, hard: 0 })
  const [stats, setStats] = useState({ total: 0, mastered: 0, learning: 0, new: 0, dueToday: 0, averageMastery: 0 })
  const [studyMode, setStudyMode] = useState('all')

  const loadStats = useCallback(async () => {
    const cardStats = await getFlashcardStats()
    setStats(cardStats)
  }, [])

  const loadFlashcards = useCallback(async () => {
    setIsLoading(true)
    try {
      let stored
      if (studyMode === 'review') {
        stored = await getFlashcardsForReview(selectedSubject?.id || null)
      } else {
        stored = await getFlashcards(selectedSubject?.id || null)
      }
      setFlashcards(stored)
      setCurrentIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error('Failed to load flashcards:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSubject, studyMode])

  useEffect(() => {
    if (isOpen) {
      loadFlashcards()
      loadStats()
    }
  }, [isOpen, loadFlashcards, loadStats])

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
    loadStats()
  }

  const handleStudyResponse = async (correct, difficulty = 'normal') => {
    const card = flashcards[currentIndex]
    if (card) {
      await updateFlashcardProgress(card.id, correct, difficulty)
    }
    
    setStudyStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
      easy: prev.easy + (difficulty === 'easy' ? 1 : 0),
      hard: prev.hard + (difficulty === 'hard' ? 1 : 0)
    }))
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    } else {
      setMode('results')
      loadStats()
    }
  }

  const startStudyMode = (type = 'all') => {
    setStudyMode(type)
    setMode('study')
    setStudyStats({ correct: 0, incorrect: 0, easy: 0, hard: 0 })
    if (type === 'all') {
      handleShuffle()
    }
  }

  const currentCard = flashcards[currentIndex]

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (mode !== 'study' || !isFlipped) return
      
      if (e.key === '1' || e.key === 'ArrowLeft') {
        handleStudyResponse(false)
      } else if (e.key === '2' || e.key === 'ArrowDown') {
        handleStudyResponse(true, 'hard')
      } else if (e.key === '3' || e.key === 'ArrowRight') {
        handleStudyResponse(true, 'normal')
      } else if (e.key === '4' || e.key === 'ArrowUp') {
        handleStudyResponse(true, 'easy')
      } else if (e.key === ' ') {
        e.preventDefault()
        setIsFlipped(!isFlipped)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [mode, isFlipped, currentIndex])

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
              <h2 className="text-lg font-bold text-white">Smart Flashcards</h2>
              <p className="text-sm text-slate-400">
                {stats.dueToday > 0 ? `${stats.dueToday} cards due for review` : 'All caught up!'}
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
          {mode === 'dashboard' && (
            <DashboardView 
              stats={stats}
              subjects={subjects}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              onStartStudy={startStudyMode}
              onBrowse={() => { setStudyMode('all'); setMode('browse') }}
              onGenerate={() => setShowGenerateModal(true)}
              onCreate={() => setShowCreateModal(true)}
              isOnline={isOnline}
              loadFlashcards={loadFlashcards}
            />
          )}

          {mode === 'results' && (
            <ResultsView 
              stats={studyStats}
              totalCards={flashcards.length}
              onBackToDashboard={() => setMode('dashboard')}
              onStudyAgain={() => startStudyMode()}
            />
          )}

          {(mode === 'browse' || mode === 'study') && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setMode('dashboard')}
                  className="px-3 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
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
                {subjects.slice(0, 6).map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedSubject?.id === subject.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{subject.name}</span>
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : flashcards.length === 0 ? (
                <EmptyState 
                  onGenerate={() => setShowGenerateModal(true)}
                  onCreate={() => setShowCreateModal(true)}
                  isOnline={isOnline}
                />
              ) : (
                <FlashcardViewer 
                  currentCard={currentCard}
                  currentIndex={currentIndex}
                  totalCards={flashcards.length}
                  isFlipped={isFlipped}
                  setIsFlipped={setIsFlipped}
                  mode={mode}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onShuffle={handleShuffle}
                  onDelete={handleDelete}
                  onStudyResponse={handleStudyResponse}
                  onStartStudy={() => startStudyMode()}
                  onExitStudy={() => setMode('browse')}
                  onGenerate={() => setShowGenerateModal(true)}
                  onCreate={() => setShowCreateModal(true)}
                  isOnline={isOnline}
                />
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
              loadStats()
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
              loadStats()
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

function DashboardView({ stats, subjects, selectedSubject, setSelectedSubject, onStartStudy, onBrowse, onGenerate, onCreate, isOnline, loadFlashcards }) {
  useEffect(() => {
    loadFlashcards()
  }, [selectedSubject, loadFlashcards])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={BookOpen} label="Total Cards" value={stats.total} color="blue" />
        <StatCard icon={Target} label="Mastered" value={stats.mastered} color="green" />
        <StatCard icon={TrendingUp} label="Learning" value={stats.learning} color="amber" />
        <StatCard icon={Clock} label="Due Today" value={stats.dueToday} color="red" />
      </div>

      {stats.averageMastery > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Overall Mastery</span>
            <span className="text-sm font-bold text-amber-400">{stats.averageMastery}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500"
              style={{ width: `${stats.averageMastery}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSubject(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            !selectedSubject
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All Subjects
        </button>
        {subjects.slice(0, 8).map((subject) => (
          <button
            key={subject.id}
            onClick={() => setSelectedSubject(subject)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedSubject?.id === subject.id
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {subject.name}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {stats.dueToday > 0 && (
          <button
            onClick={() => onStartStudy('review')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-red-400 hover:to-pink-500 transition-colors"
          >
            <Flame className="w-5 h-5" />
            Review Due Cards ({stats.dueToday})
          </button>
        )}

        <button
          onClick={() => onStartStudy('all')}
          disabled={stats.total === 0}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-amber-400 hover:to-orange-500 transition-colors disabled:opacity-50"
        >
          <Zap className="w-5 h-5" />
          Start Study Session
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onBrowse}
            disabled={stats.total === 0}
            className="py-3 rounded-xl bg-slate-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <BookOpen className="w-4 h-4" />
            Browse Cards
          </button>
          <button
            onClick={onGenerate}
            disabled={!isOnline}
            className="py-3 rounded-xl bg-slate-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            Generate with AI
          </button>
        </div>

        <button
          onClick={onCreate}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 font-medium flex items-center justify-center gap-2 hover:border-slate-600 hover:text-slate-300 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Card Manually
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 text-blue-400',
    green: 'from-green-500/20 to-green-600/20 text-green-400',
    amber: 'from-amber-500/20 to-amber-600/20 text-amber-400',
    red: 'from-red-500/20 to-red-600/20 text-red-400'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-3 text-center`}>
      <Icon className="w-5 h-5 mx-auto mb-1" />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  )
}

function ResultsView({ stats, totalCards, onBackToDashboard, onStudyAgain }) {
  const accuracy = totalCards > 0 ? Math.round((stats.correct / totalCards) * 100) : 0

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
        <Award className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Study Complete!</h3>
      <p className="text-slate-400 mb-6">You've reviewed {totalCards} cards</p>
      
      <div className="flex justify-center gap-8 mb-8">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-400">{stats.correct}</p>
          <p className="text-sm text-slate-400">Correct</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-red-400">{stats.incorrect}</p>
          <p className="text-sm text-slate-400">Incorrect</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-amber-400">{accuracy}%</p>
          <p className="text-sm text-slate-400">Accuracy</p>
        </div>
      </div>

      {accuracy >= 80 && (
        <p className="text-green-400 mb-6">Excellent work! Keep it up!</p>
      )}
      {accuracy >= 50 && accuracy < 80 && (
        <p className="text-amber-400 mb-6">Good progress! Practice makes perfect.</p>
      )}
      {accuracy < 50 && (
        <p className="text-red-400 mb-6">Keep practicing! You'll improve with time.</p>
      )}
      
      <div className="flex justify-center gap-4">
        <button
          onClick={onBackToDashboard}
          className="px-6 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          onClick={onStudyAgain}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:from-amber-400 hover:to-orange-500 transition-colors"
        >
          Study Again
        </button>
      </div>
    </div>
  )
}

function EmptyState({ onGenerate, onCreate, isOnline }) {
  return (
    <div className="text-center py-12">
      <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">No Flashcards Yet</h3>
      <p className="text-slate-400 mb-6">Create flashcards manually or generate them with AI</p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={onCreate}
          className="px-6 py-3 rounded-xl bg-slate-700 text-white font-medium flex items-center gap-2 justify-center hover:bg-slate-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Manually
        </button>
        <button
          onClick={onGenerate}
          disabled={!isOnline}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium flex items-center gap-2 justify-center disabled:opacity-50"
        >
          <Wand2 className="w-5 h-5" />
          Generate with AI
        </button>
      </div>
    </div>
  )
}

function FlashcardViewer({ 
  currentCard, currentIndex, totalCards, isFlipped, setIsFlipped,
  mode, onNext, onPrevious, onShuffle, onDelete, onStudyResponse,
  onStartStudy, onExitStudy, onGenerate, onCreate, isOnline
}) {
  const mastery = currentCard?.mastery || 0
  const streak = currentCard?.streak || 0

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            Card {currentIndex + 1} of {totalCards}
          </span>
          {streak > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center gap-1">
              <Flame className="w-3 h-3" /> {streak}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGenerate}
            disabled={!isOnline}
            className="p-2 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50"
            title="Generate with AI"
          >
            <Wand2 className="w-5 h-5" />
          </button>
          <button
            onClick={onCreate}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Create New"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={onShuffle}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          {mode === 'browse' && (
            <button
              onClick={onStartStudy}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Study
            </button>
          )}
        </div>
      </div>

      {mastery > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Mastery</span>
            <span className="text-xs text-amber-400">{mastery}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                mastery >= 80 ? 'bg-green-500' : mastery >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>
      )}

      <div 
        className="perspective-1000 min-h-[280px] cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div 
          className="relative w-full h-full min-h-[280px]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col justify-center items-center text-center"
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
              Tap to reveal answer
            </p>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-6 flex flex-col justify-center items-center text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-lg text-white font-medium leading-relaxed whitespace-pre-wrap">
              {currentCard?.back}
            </p>
          </div>
        </motion.div>
      </div>

      {mode === 'study' && isFlipped && (
        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-slate-400 mb-2">How well did you know this?</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onStudyResponse(false)}
              className="py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition-colors flex flex-col items-center gap-1"
            >
              <ThumbsDown className="w-5 h-5" />
              <span className="text-xs">Again</span>
            </button>
            <button
              onClick={() => onStudyResponse(true, 'hard')}
              className="py-3 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-500 transition-colors flex flex-col items-center gap-1"
            >
              <span className="text-lg">😓</span>
              <span className="text-xs">Hard</span>
            </button>
            <button
              onClick={() => onStudyResponse(true, 'normal')}
              className="py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors flex flex-col items-center gap-1"
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="text-xs">Good</span>
            </button>
            <button
              onClick={() => onStudyResponse(true, 'easy')}
              className="py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-500 transition-colors flex flex-col items-center gap-1"
            >
              <span className="text-lg">🎯</span>
              <span className="text-xs">Easy</span>
            </button>
          </div>
          <p className="text-center text-xs text-slate-500">Keyboard: 1-Again, 2-Hard, 3-Good, 4-Easy</p>
        </div>
      )}

      {mode === 'browse' && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="p-3 rounded-xl bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          {currentCard && (
            <button
              onClick={() => onDelete(currentCard.id)}
              className="p-3 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
              title="Delete Card"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={onNext}
            disabled={currentIndex >= totalCards - 1}
            className="p-3 rounded-xl bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {mode === 'study' && (
        <button
          onClick={onExitStudy}
          className="mt-4 w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Study Mode
        </button>
      )}
    </>
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
            <h3 className="text-lg font-bold text-white">AI Flashcard Generator</h3>
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
            AI will automatically generate flashcards based on the JAMB syllabus for quick revision.
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
              <option value={3}>3 cards (Quick)</option>
              <option value={5}>5 cards (Recommended)</option>
              <option value={10}>10 cards (Comprehensive)</option>
              <option value={15}>15 cards (Deep Dive)</option>
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
                Generating with AI...
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
