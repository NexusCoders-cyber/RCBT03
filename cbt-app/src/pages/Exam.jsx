import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, ChevronLeft, ChevronRight, Flag, Send, 
  AlertTriangle, Grid, X, Check, Bookmark, Calculator as CalcIcon, Volume2 
} from 'lucide-react'
import useStore from '../store/useStore'
import Calculator from '../components/Calculator'
import { VoiceReaderCompact } from '../components/VoiceReader'

export default function Exam() {
  const navigate = useNavigate()
  const {
    examMode,
    selectedSubjects,
    questions,
    currentQuestionIndex,
    currentSubjectIndex,
    answers,
    markedForReview,
    timeRemaining,
    timerEnabled,
    isExamActive,
    calculatorEnabled,
    showCalculator,
    setShowCalculator,
    setCurrentQuestion,
    setCurrentSubject,
    answerQuestion,
    toggleMarkForReview,
    updateTimeRemaining,
    submitExam,
    bookmarkQuestion,
    bookmarkedQuestions,
    subjects,
  } = useStore()

  const [showNavGrid, setShowNavGrid] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const hasSubmittedRef = useRef(false)

  useEffect(() => {
    if (!isExamActive || questions.length === 0) {
      navigate('/')
    }
  }, [isExamActive, questions, navigate])

  useEffect(() => {
    if (!timerEnabled || !isExamActive) return
    if (hasSubmittedRef.current) return

    const timer = setInterval(() => {
      const currentTime = useStore.getState().timeRemaining
      
      if (currentTime <= 1) {
        clearInterval(timer)
        if (!hasSubmittedRef.current) {
          hasSubmittedRef.current = true
          submitExam()
          navigate('/results')
        }
        return
      }
      
      updateTimeRemaining(currentTime - 1)
      
      if (currentTime <= 301 && !showTimeWarning) {
        setShowTimeWarning(true)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timerEnabled, isExamActive, updateTimeRemaining, submitExam, navigate])

  const currentQuestion = questions[currentQuestionIndex]
  const currentSubject = selectedSubjects[currentSubjectIndex]
  const currentSubjectInfo = subjects.find(s => s.id === currentSubject?.id)
  const isCalculationSubject = currentSubjectInfo?.isCalculation || false

  const isQuestionBookmarked = currentQuestion ? 
    bookmarkedQuestions.some(q => q.id === currentQuestion.id) : false

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestion(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1)
    }
  }

  const handleAnswer = (option) => {
    answerQuestion(currentQuestionIndex, option)
  }

  const handleSubmit = useCallback(() => {
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true
    submitExam()
    navigate('/results')
  }, [submitExam, navigate])

  const handleBookmark = () => {
    if (currentQuestion) {
      bookmarkQuestion({
        ...currentQuestion,
        subject: currentSubject?.id,
      })
    }
  }

  const getQuestionStatus = (index) => {
    const isAnswered = answers[index] !== undefined
    const isMarked = markedForReview.includes(index)
    const isCurrent = index === currentQuestionIndex

    if (isCurrent) return 'current'
    if (isMarked) return 'marked'
    if (isAnswered) return 'answered'
    return 'unanswered'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'current':
        return 'bg-emerald-600 text-white border-emerald-600'
      case 'marked':
        return 'bg-orange-500 text-white border-orange-500'
      case 'answered':
        return 'bg-blue-500 text-white border-blue-500'
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  const getSubjectQuestions = (subjectId) => {
    return questions.filter(q => q.subjectId === subjectId)
  }

  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {examMode === 'full' && (
                <div className="hidden sm:flex gap-1 overflow-x-auto pb-1">
                  {selectedSubjects.map((subject, idx) => (
                    <button
                      key={subject.id}
                      onClick={() => setCurrentSubject(idx)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                        idx === currentSubjectIndex 
                          ? 'bg-emerald-600 text-white shadow-lg' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <span className="mr-1">{subject.icon}</span>
                      <span className="hidden md:inline">{subject.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {examMode === 'practice' && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentSubject?.icon}</span>
                  <span className="font-semibold text-white">
                    {currentSubject?.name}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {timerEnabled && timeRemaining > 0 && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg
                  ${timeRemaining <= 300 
                    ? 'bg-red-900/50 text-red-400 animate-pulse' 
                    : 'bg-slate-700 text-emerald-400'
                  }`}>
                  <Clock className="w-5 h-5" />
                  {formatTime(timeRemaining)}
                </div>
              )}
              
              {calculatorEnabled && isCalculationSubject && (
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={`p-2 rounded-xl transition-colors ${
                    showCalculator 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title="Calculator"
                >
                  <CalcIcon className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => setShowNavGrid(true)}
                className="p-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {examMode === 'full' && (
            <div className="flex sm:hidden gap-1 mt-3 overflow-x-auto pb-1">
              {selectedSubjects.map((subject, idx) => (
                <button
                  key={subject.id}
                  onClick={() => setCurrentSubject(idx)}
                  className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                    idx === currentSubjectIndex 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {subject.icon}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <VoiceReaderCompact question={currentQuestion} />
                <button
                  onClick={handleBookmark}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
                    ${isQuestionBookmarked
                      ? 'bg-amber-900/50 text-amber-400'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                >
                  <Bookmark className={`w-4 h-4 ${isQuestionBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => toggleMarkForReview(currentQuestionIndex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
                    ${markedForReview.includes(currentQuestionIndex)
                      ? 'bg-orange-900/50 text-orange-400'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {markedForReview.includes(currentQuestionIndex) ? 'Marked' : 'Mark'}
                  </span>
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-700">
              <div 
                className="text-lg sm:text-xl text-white leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
              />

              {currentQuestion.image && (
                <div className="mb-6 p-3 bg-slate-700/50 rounded-xl">
                  <img 
                    src={currentQuestion.image} 
                    alt="Question diagram" 
                    className="max-w-full h-auto rounded-lg mx-auto"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  if (!value) return null
                  const isSelected = answers[currentQuestionIndex] === key
                  
                  return (
                    <button
                      key={key}
                      onClick={() => handleAnswer(key)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start gap-4
                        ${isSelected
                          ? 'border-emerald-500 bg-emerald-900/30'
                          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                        }`}
                    >
                      <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold
                        ${isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                        }`}>
                        {key.toUpperCase()}
                      </span>
                      <span 
                        className="text-slate-200 pt-2"
                        dangerouslySetInnerHTML={{ __html: value }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-slate-800 border-t border-slate-700 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 rounded-xl font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-3 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <Send className="w-5 h-5" />
              <span>Submit</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-6 py-3 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>

      <Calculator />

      <AnimatePresence>
        {showNavGrid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowNavGrid(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-slate-800 w-full sm:w-auto sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Question Navigator</h3>
                <button
                  onClick={() => setShowNavGrid(false)}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="text-slate-400">Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  <span className="text-slate-400">Marked</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-emerald-600"></div>
                  <span className="text-slate-400">Current</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600"></div>
                  <span className="text-slate-400">Not Answered</span>
                </div>
              </div>

              {examMode === 'full' ? (
                <div className="space-y-4">
                  {selectedSubjects.map((subject) => {
                    const subjectQuestions = getSubjectQuestions(subject.id)
                    const startIndex = questions.findIndex(q => q.subjectId === subject.id)
                    
                    return (
                      <div key={subject.id}>
                        <p className="font-medium text-white mb-2 flex items-center gap-2">
                          <span>{subject.icon}</span>
                          {subject.name}
                        </p>
                        <div className="grid grid-cols-10 gap-1">
                          {subjectQuestions.map((_, idx) => {
                            const globalIdx = startIndex + idx
                            const status = getQuestionStatus(globalIdx)
                            return (
                              <button
                                key={globalIdx}
                                onClick={() => {
                                  setCurrentQuestion(globalIdx)
                                  setShowNavGrid(false)
                                }}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm border-2 transition-all duration-200 hover:scale-105 ${getStatusColor(status)}`}
                              >
                                {idx + 1}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-10 gap-1">
                  {questions.map((_, idx) => {
                    const status = getQuestionStatus(idx)
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentQuestion(idx)
                          setShowNavGrid(false)
                        }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm border-2 transition-all duration-200 hover:scale-105 ${getStatusColor(status)}`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-900/50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Submit Exam?</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between p-3 rounded-xl bg-slate-700/50">
                  <span className="text-slate-300">Total Questions</span>
                  <span className="font-semibold text-white">{questions.length}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-emerald-900/30">
                  <span className="text-emerald-300">Answered</span>
                  <span className="font-semibold text-emerald-300">{answeredCount}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-red-900/30">
                  <span className="text-red-300">Unanswered</span>
                  <span className="font-semibold text-red-300">{unansweredCount}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-orange-900/30">
                  <span className="text-orange-300">Marked for Review</span>
                  <span className="font-semibold text-orange-300">{markedForReview.length}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
