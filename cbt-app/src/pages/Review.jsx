import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Check, X, 
  Eye, Grid, Home, Bot, Lightbulb, BookOpen, Clock,
  Target, Award, TrendingUp, BarChart3, Bookmark,
  Share2, Download, RefreshCw
} from 'lucide-react'
import useStore from '../store/useStore'
import AIAssistant from '../components/AIAssistant'
import { VoiceReaderCompact } from '../components/VoiceReader'

export default function Review() {
  const navigate = useNavigate()
  const { 
    questions, 
    answers, 
    selectedSubjects, 
    currentExam, 
    isExamSubmitted,
    resetExam 
  } = useStore()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showNavGrid, setShowNavGrid] = useState(false)
  const [filter, setFilter] = useState('all')
  const [showAI, setShowAI] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('review-bookmarks')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('review-bookmarks', JSON.stringify([...bookmarkedQuestions]))
    } catch {}
  }, [bookmarkedQuestions])

  useEffect(() => {
    if (!isExamSubmitted || questions.length === 0) {
      navigate('/')
    }
  }, [isExamSubmitted, questions, navigate])

  if (!isExamSubmitted || questions.length === 0) return null

  const stats = {
    total: questions.length,
    correct: questions.filter((q, idx) => answers[idx] === q.answer).length,
    wrong: questions.filter((q, idx) => answers[idx] !== undefined && answers[idx] !== q.answer).length,
    unanswered: questions.filter((q, idx) => answers[idx] === undefined).length
  }
  stats.percentage = Math.round((stats.correct / stats.total) * 100)
  stats.grade = stats.percentage >= 70 ? 'A' : stats.percentage >= 60 ? 'B' : stats.percentage >= 50 ? 'C' : stats.percentage >= 40 ? 'D' : 'F'

  const filteredQuestions = questions.map((q, idx) => ({ ...q, originalIndex: idx })).filter((q, idx) => {
    if (filter === 'all') return true
    if (filter === 'correct') return answers[q.originalIndex] === q.answer
    if (filter === 'wrong') return answers[q.originalIndex] !== undefined && answers[q.originalIndex] !== q.answer
    if (filter === 'unanswered') return answers[q.originalIndex] === undefined
    if (filter === 'bookmarked') return bookmarkedQuestions.has(q.originalIndex)
    return true
  })

  const currentQuestion = filteredQuestions[currentIndex]
  const userAnswer = answers[currentQuestion?.originalIndex]
  const isCorrect = userAnswer === currentQuestion?.answer
  const isUnanswered = userAnswer === undefined

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleGoToQuestion = (idx) => {
    setCurrentIndex(idx)
    setShowNavGrid(false)
  }

  const toggleBookmark = (idx) => {
    const newBookmarks = new Set(bookmarkedQuestions)
    if (newBookmarks.has(idx)) {
      newBookmarks.delete(idx)
    } else {
      newBookmarks.add(idx)
    }
    setBookmarkedQuestions(newBookmarks)
  }

  const getQuestionStatus = (q) => {
    const answer = answers[q.originalIndex]
    if (answer === undefined) return 'unanswered'
    if (answer === q.answer) return 'correct'
    return 'wrong'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'correct':
        return 'bg-green-500 text-white border-green-500'
      case 'wrong':
        return 'bg-red-500 text-white border-red-500'
      default:
        return 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
    }
  }

  const handleExit = () => {
    resetExam()
    navigate('/')
  }

  const filterButtons = [
    { key: 'all', label: 'All', count: stats.total, color: 'bg-blue-600' },
    { key: 'correct', label: 'Correct', count: stats.correct, color: 'bg-green-600' },
    { key: 'wrong', label: 'Wrong', count: stats.wrong, color: 'bg-red-600' },
    { key: 'unanswered', label: 'Skipped', count: stats.unanswered, color: 'bg-slate-600' },
    { key: 'bookmarked', label: 'Saved', count: bookmarkedQuestions.size, color: 'bg-amber-600' }
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleExit}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Review Answers</h1>
                <p className="text-slate-400 text-sm">
                  Question {currentIndex + 1} of {filteredQuestions.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-2 rounded-xl transition-colors ${showStats ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                title="Toggle Stats"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowNavGrid(true)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-2xl p-5 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Performance Summary
                    </h3>
                    <div className={`px-4 py-1 rounded-full font-bold text-lg ${
                      stats.percentage >= 70 ? 'bg-green-600 text-white' :
                      stats.percentage >= 50 ? 'bg-amber-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {stats.percentage}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{stats.total}</div>
                      <div className="text-xs text-slate-400">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.correct}</div>
                      <div className="text-xs text-slate-400">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.wrong}</div>
                      <div className="text-xs text-slate-400">Wrong</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-400">{stats.unanswered}</div>
                      <div className="text-xs text-slate-400">Skipped</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className="h-full flex">
                      <div 
                        className="bg-green-500 transition-all duration-500"
                        style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                      />
                      <div 
                        className="bg-red-500 transition-all duration-500"
                        style={{ width: `${(stats.wrong / stats.total) * 100}%` }}
                      />
                      <div 
                        className="bg-slate-500 transition-all duration-500"
                        style={{ width: `${(stats.unanswered / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => { setFilter(btn.key); setCurrentIndex(0); }}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2
                  ${filter === btn.key
                    ? `${btn.color} text-white`
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                {btn.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filter === btn.key ? 'bg-white/20' : 'bg-slate-700'
                }`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          {currentQuestion && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className={`bg-slate-800 rounded-2xl border-2 overflow-hidden ${
                  isUnanswered 
                    ? 'border-slate-600' 
                    : isCorrect 
                      ? 'border-green-500/50' 
                      : 'border-red-500/50'
                }`}>
                  <div className={`px-5 py-3 flex items-center justify-between ${
                    isUnanswered 
                      ? 'bg-slate-700/50' 
                      : isCorrect 
                        ? 'bg-green-900/30' 
                        : 'bg-red-900/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      {isUnanswered ? (
                        <span className="px-3 py-1 rounded-full bg-slate-600 text-slate-200 text-sm font-medium">
                          Not Answered
                        </span>
                      ) : isCorrect ? (
                        <span className="px-3 py-1 rounded-full bg-green-600 text-white text-sm font-medium flex items-center gap-1">
                          <Check className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white text-sm font-medium flex items-center gap-1">
                          <X className="w-4 h-4" /> Wrong
                        </span>
                      )}
                      {currentQuestion.examyear && (
                        <span className="text-sm text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          JAMB {currentQuestion.examyear}
                        </span>
                      )}
                      {currentQuestion.novelTitle && (
                        <span className="text-sm text-amber-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {currentQuestion.novelTitle}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBookmark(currentQuestion.originalIndex)}
                        className={`p-2 rounded-lg transition-colors ${
                          bookmarkedQuestions.has(currentQuestion.originalIndex)
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Bookmark"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <VoiceReaderCompact question={currentQuestion} />
                      <button
                        onClick={() => setShowAI(true)}
                        className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all"
                        title="AI Assistant"
                      >
                        <Bot className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-6">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 text-white font-bold text-sm flex items-center justify-center">
                        {currentQuestion.originalIndex + 1}
                      </span>
                      <div 
                        className="text-lg text-white leading-relaxed flex-1"
                        dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
                      />
                    </div>

                    {currentQuestion.image && (
                      <div className="mb-6 rounded-xl overflow-hidden bg-slate-900 p-4">
                        <img 
                          src={currentQuestion.image} 
                          alt="Question diagram" 
                          className="max-w-full h-auto mx-auto"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      {Object.entries(currentQuestion.options).map(([key, value]) => {
                        if (!value) return null
                        const isUserAnswer = userAnswer === key
                        const isCorrectAnswer = currentQuestion.answer === key
                        
                        let optionClass = 'border-slate-700 bg-slate-800/50 hover:bg-slate-700/50'
                        let labelClass = 'bg-slate-700 text-slate-300'
                        
                        if (isCorrectAnswer) {
                          optionClass = 'border-green-500 bg-green-900/20'
                          labelClass = 'bg-green-500 text-white'
                        } else if (isUserAnswer && !isCorrectAnswer) {
                          optionClass = 'border-red-500 bg-red-900/20'
                          labelClass = 'bg-red-500 text-white'
                        }
                        
                        return (
                          <div
                            key={key}
                            className={`p-4 rounded-xl border-2 flex items-start gap-4 transition-all ${optionClass}`}
                          >
                            <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${labelClass}`}>
                              {isCorrectAnswer ? <Check className="w-5 h-5" /> : 
                               isUserAnswer ? <X className="w-5 h-5" /> : key.toUpperCase()}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span 
                                className="text-slate-200 block"
                                dangerouslySetInnerHTML={{ __html: value }}
                              />
                              {isCorrectAnswer && (
                                <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-green-400 bg-green-900/30 px-2 py-1 rounded-full">
                                  <Check className="w-3 h-3" /> Correct Answer
                                </span>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-red-400 bg-red-900/30 px-2 py-1 rounded-full">
                                  <X className="w-3 h-3" /> Your Answer
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {currentQuestion.solution && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 rounded-xl bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-700/50"
                      >
                        <p className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-amber-400" />
                          Explanation
                        </p>
                        <div 
                          className="text-blue-100 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: currentQuestion.solution }}
                        />
                      </motion.div>
                    )}

                    {currentQuestion.explanation && !currentQuestion.solution && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 rounded-xl bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-700/50"
                      >
                        <p className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-amber-400" />
                          Explanation
                        </p>
                        <p className="text-blue-100 leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 py-4 rounded-xl bg-slate-800 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            
            <button
              onClick={handleExit}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-teal-500 transition-colors"
            >
              <Home className="w-5 h-5" />
              Exit
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex >= filteredQuestions.length - 1}
              className="flex-1 py-4 rounded-xl bg-slate-800 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showNavGrid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowNavGrid(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-slate-800 w-full sm:w-auto sm:max-w-lg rounded-2xl overflow-hidden max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white">Question Navigator</h3>
                <button
                  onClick={() => setShowNavGrid(false)}
                  className="p-2 rounded-lg hover:bg-slate-700"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-4 border-b border-slate-700">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-slate-300">Correct</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-slate-300">Wrong</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-slate-500"></div>
                    <span className="text-slate-300">Unanswered</span>
                  </div>
                </div>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                  {filteredQuestions.map((q, idx) => {
                    const status = getQuestionStatus(q)
                    return (
                      <button
                        key={idx}
                        onClick={() => handleGoToQuestion(idx)}
                        className={`question-nav-btn ${getStatusColor(status)} ${
                          idx === currentIndex ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-800' : ''
                        }`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIAssistant 
        isOpen={showAI} 
        onClose={() => setShowAI(false)} 
        currentQuestion={currentQuestion}
        currentSubject={selectedSubjects[0]}
      />
    </div>
  )
}
