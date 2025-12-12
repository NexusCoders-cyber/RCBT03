import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Flag, Send, Eye, EyeOff,
  AlertTriangle, Grid, X, Check, Bookmark, Calculator as CalcIcon,
  Lightbulb, CheckCircle, XCircle
} from 'lucide-react'
import useStore from '../store/useStore'
import Calculator from '../components/Calculator'
import { VoiceReaderCompact } from '../components/VoiceReader'

export default function Study() {
  const navigate = useNavigate()
  const {
    examMode,
    selectedSubjects,
    questions,
    currentQuestionIndex,
    currentSubjectIndex,
    answers,
    markedForReview,
    isExamActive,
    calculatorEnabled,
    showCalculator,
    setShowCalculator,
    setCurrentQuestion,
    setCurrentSubject,
    answerQuestion,
    toggleMarkForReview,
    submitExam,
    bookmarkQuestion,
    bookmarkedQuestions,
    subjects,
    studyMode,
    revealAnswer,
    hideAnswer,
  } = useStore()

  const [showNavGrid, setShowNavGrid] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const hasSubmittedRef = useRef(false)

  useEffect(() => {
    if (!isExamActive || questions.length === 0 || examMode !== 'study') {
      navigate('/')
    }
  }, [isExamActive, questions, examMode, navigate])

  const currentQuestion = questions[currentQuestionIndex]
  const currentSubject = selectedSubjects[currentSubjectIndex]
  const currentSubjectInfo = subjects.find(s => s.id === currentSubject?.id)
  const isCalculationSubject = currentSubjectInfo?.isCalculation || false

  const isQuestionBookmarked = currentQuestion ? 
    bookmarkedQuestions.some(q => q.id === currentQuestion.id) : false

  const userAnswer = answers[currentQuestionIndex]
  const hasAnswered = userAnswer !== undefined
  const isCorrect = hasAnswered && userAnswer === currentQuestion?.answer
  const showingAnswer = studyMode.currentAnswerRevealed || hasAnswered

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
    if (!hasAnswered) {
      answerQuestion(currentQuestionIndex, option)
    }
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

  const handleToggleAnswer = () => {
    if (studyMode.currentAnswerRevealed) {
      hideAnswer()
    } else {
      revealAnswer()
    }
  }

  const getQuestionStatus = (index) => {
    const answered = answers[index] !== undefined
    const correct = answered && answers[index] === questions[index]?.answer
    const isMarked = markedForReview.includes(index)
    const isCurrent = index === currentQuestionIndex

    if (isCurrent) return 'current'
    if (isMarked) return 'marked'
    if (correct) return 'correct'
    if (answered) return 'wrong'
    return 'unanswered'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'current':
        return 'bg-violet-600 text-white border-violet-600'
      case 'marked':
        return 'bg-orange-500 text-white border-orange-500'
      case 'correct':
        return 'bg-green-500 text-white border-green-500'
      case 'wrong':
        return 'bg-red-500 text-white border-red-500'
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  const getSubjectQuestions = (subjectId) => {
    return questions.filter(q => q.subjectId === subjectId)
  }

  const answeredCount = Object.keys(answers).length
  const correctCount = Object.entries(answers).filter(([idx, ans]) => 
    questions[parseInt(idx)]?.answer === ans
  ).length
  const unansweredCount = questions.length - answeredCount

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex gap-1 overflow-x-auto pb-1">
                {selectedSubjects.map((subject, idx) => (
                  <button
                    key={subject.id}
                    onClick={() => setCurrentSubject(idx)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                      idx === currentSubjectIndex 
                        ? 'bg-violet-600 text-white shadow-lg' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="mr-1">{subject.icon}</span>
                    <span className="hidden md:inline">{subject.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-900/30 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">{correctCount}/{answeredCount}</span>
              </div>
              
              {calculatorEnabled && isCalculationSubject && (
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={`p-2 rounded-xl transition-colors ${
                    showCalculator 
                      ? 'bg-violet-600 text-white' 
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

          <div className="flex sm:hidden gap-1 mt-3 overflow-x-auto pb-1">
            {selectedSubjects.map((subject, idx) => (
              <button
                key={subject.id}
                onClick={() => setCurrentSubject(idx)}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                  idx === currentSubjectIndex 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {subject.icon}
              </button>
            ))}
          </div>
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
                
                {!hasAnswered && (
                  <button
                    onClick={handleToggleAnswer}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
                      ${studyMode.currentAnswerRevealed
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    title={studyMode.currentAnswerRevealed ? 'Hide Answer' : 'Show Answer'}
                  >
                    {studyMode.currentAnswerRevealed ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Show</span>
                      </>
                    )}
                  </button>
                )}
                
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
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-700">
              {currentQuestion.examyear && (
                <div className="mb-4">
                  <span className="px-3 py-1 rounded-full bg-violet-900/50 text-violet-300 text-sm font-medium">
                    JAMB {currentQuestion.examyear}
                  </span>
                </div>
              )}
              
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
                  const isSelected = userAnswer === key
                  const isCorrectAnswer = currentQuestion.answer === key
                  const showAsCorrect = showingAnswer && isCorrectAnswer
                  const showAsWrong = hasAnswered && isSelected && !isCorrect
                  
                  let optionClass = 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                  let buttonClass = 'bg-slate-700 text-slate-300'
                  
                  if (showAsCorrect) {
                    optionClass = 'border-green-500 bg-green-900/30'
                    buttonClass = 'bg-green-500 text-white'
                  } else if (showAsWrong) {
                    optionClass = 'border-red-500 bg-red-900/30'
                    buttonClass = 'bg-red-500 text-white'
                  } else if (isSelected) {
                    optionClass = 'border-violet-500 bg-violet-900/30'
                    buttonClass = 'bg-violet-500 text-white'
                  }
                  
                  return (
                    <button
                      key={key}
                      onClick={() => handleAnswer(key)}
                      disabled={hasAnswered}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start gap-4 ${optionClass} ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold ${buttonClass}`}>
                        {showAsCorrect ? <Check className="w-5 h-5" /> : 
                         showAsWrong ? <X className="w-5 h-5" /> : 
                         key.toUpperCase()}
                      </span>
                      <span 
                        className="text-slate-200 pt-2 flex-1"
                        dangerouslySetInnerHTML={{ __html: value }}
                      />
                      {showAsCorrect && (
                        <span className="text-xs font-medium text-green-400 pt-2">Correct</span>
                      )}
                      {showAsWrong && (
                        <span className="text-xs font-medium text-red-400 pt-2">Wrong</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {hasAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
                    isCorrect 
                      ? 'bg-green-900/30 border border-green-800' 
                      : 'bg-red-900/30 border border-red-800'
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="font-semibold text-green-400">Correct!</p>
                        <p className="text-sm text-green-300">Great job, keep it up!</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-400" />
                      <div>
                        <p className="font-semibold text-red-400">Incorrect</p>
                        <p className="text-sm text-red-300">
                          The correct answer is <strong>{currentQuestion.answer?.toUpperCase()}</strong>
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {showingAnswer && currentQuestion.solution && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-blue-900/20 border border-blue-800"
                >
                  <p className="font-semibold text-blue-100 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                    Explanation
                  </p>
                  <p 
                    className="text-blue-200 text-sm"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.solution }}
                  />
                </motion.div>
              )}
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
              className="px-6 py-3 rounded-xl font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors flex items-center gap-2 shadow-lg shadow-violet-600/30"
            >
              <Send className="w-5 h-5" />
              <span>Finish</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-6 py-3 rounded-xl font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-slate-400">Correct</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-slate-400">Wrong</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  <span className="text-slate-400">Marked</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-violet-600"></div>
                  <span className="text-slate-400">Current</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600"></div>
                  <span className="text-slate-400">Not Answered</span>
                </div>
              </div>

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
                <div className="w-12 h-12 rounded-full bg-violet-900/50 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Finish Study Session?</h3>
                  <p className="text-sm text-slate-400">View your results and review</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between p-3 rounded-xl bg-slate-700/50">
                  <span className="text-slate-300">Total Questions</span>
                  <span className="font-semibold text-white">{questions.length}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-green-900/30">
                  <span className="text-green-300">Correct</span>
                  <span className="font-semibold text-green-300">{correctCount}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-red-900/30">
                  <span className="text-red-300">Wrong</span>
                  <span className="font-semibold text-red-300">{answeredCount - correctCount}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-700/50">
                  <span className="text-slate-300">Not Answered</span>
                  <span className="font-semibold text-slate-300">{unansweredCount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Continue
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Finish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
