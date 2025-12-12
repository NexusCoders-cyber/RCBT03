import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Play, Loader2, AlertCircle, BookOpen, Calendar, Hash, Sparkles } from 'lucide-react'
import useStore from '../store/useStore'
import { loadQuestionsForExam } from '../services/api'

export default function StudySetup() {
  const navigate = useNavigate()
  const { subjects, years, startStudyMode, addNotification, isOnline } = useStore()

  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [selectedYears, setSelectedYears] = useState(['random'])
  const [questionsPerSubject, setQuestionsPerSubject] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0, subject: '' })
  const [showAllYears, setShowAllYears] = useState(false)

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => {
      if (prev.find(s => s.id === subject.id)) {
        return prev.filter(s => s.id !== subject.id)
      }
      return [...prev, subject]
    })
    setError(null)
  }

  const toggleYear = (year) => {
    setSelectedYears(prev => {
      if (year === 'random') {
        return ['random']
      }
      const withoutRandom = prev.filter(y => y !== 'random')
      if (withoutRandom.includes(year)) {
        const newYears = withoutRandom.filter(y => y !== year)
        return newYears.length === 0 ? ['random'] : newYears
      }
      return [...withoutRandom, year]
    })
  }

  const isSubjectSelected = (subjectId) => {
    return selectedSubjects.some(s => s.id === subjectId)
  }

  const handleStartStudy = async () => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject')
      return
    }

    setIsLoading(true)
    setError(null)
    setLoadingProgress({ loaded: 0, total: selectedSubjects.length, subject: 'Starting...' })

    try {
      const questionsMap = await loadQuestionsForExam(
        selectedSubjects.map(s => ({ ...s, count: questionsPerSubject })),
        (progress) => {
          setLoadingProgress(progress)
        }
      )

      const totalQuestions = Object.values(questionsMap).reduce((sum, q) => sum + q.length, 0)
      
      if (totalQuestions === 0) {
        if (!isOnline) {
          addNotification({
            type: 'warning',
            title: 'No Cached Questions',
            message: 'You are offline and no questions are cached for these subjects.',
          })
        }
        throw new Error('Could not load any questions. Please try again or check your connection.')
      }

      const limitedQuestionsMap = {}
      Object.keys(questionsMap).forEach(subjectId => {
        limitedQuestionsMap[subjectId] = questionsMap[subjectId].slice(0, questionsPerSubject)
      })

      addNotification({
        type: 'success',
        title: 'Study Session Started',
        message: `${Object.values(limitedQuestionsMap).reduce((sum, q) => sum + q.length, 0)} questions loaded. Happy studying!`,
      })

      startStudyMode(selectedSubjects, limitedQuestionsMap)
      navigate('/study')
    } catch (err) {
      setError(err.message || 'Failed to load questions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const displayedYears = showAllYears ? years : years.slice(0, 12)

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
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-violet-400" />
                Study Mode
              </h1>
              <p className="text-slate-400">Learn at your own pace, no pressure!</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-violet-900/40 to-purple-900/40 rounded-2xl p-5 border border-violet-800/50">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-violet-100 mb-1">Study Mode Features</p>
                <ul className="text-violet-200 space-y-1">
                  <li>• <strong>No Timer</strong> - Study without time pressure</li>
                  <li>• <strong>Instant Feedback</strong> - See correct answer after selecting</li>
                  <li>• <strong>Show Answer</strong> - Reveal answer anytime before answering</li>
                  <li>• <strong>Multiple Subjects</strong> - Study as many subjects as you want</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-900/30 border border-red-800 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-400" />
                Select Subjects
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedSubjects.length > 0
                  ? 'bg-violet-900/50 text-violet-300'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {selectedSubjects.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {subjects.map((subject) => {
                const isSelected = isSubjectSelected(subject.id)
                
                return (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left relative
                      ${isSelected
                        ? 'border-violet-500 bg-violet-900/30'
                        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                      }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-2xl block mb-1">{subject.icon}</span>
                    <span className="font-medium text-sm text-white">{subject.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-400" />
              Select Years (Optional)
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              <button
                onClick={() => toggleYear('random')}
                className={`p-3 rounded-xl font-medium transition-all duration-200 col-span-2
                  ${selectedYears.includes('random')
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                All Years Mix
              </button>
              {displayedYears.map((year) => (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  className={`p-3 rounded-xl font-medium transition-all duration-200
                    ${selectedYears.includes(year)
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {year}
                </button>
              ))}
            </div>
            {years.length > 12 && (
              <button
                onClick={() => setShowAllYears(!showAllYears)}
                className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                {showAllYears ? 'Show less' : `Show all ${years.length} years`}
              </button>
            )}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-violet-400" />
              Questions Per Subject
            </h2>
            <div className="flex flex-wrap gap-2">
              {[10, 15, 20, 30, 40, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionsPerSubject(count)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200
                    ${questionsPerSubject === count
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {selectedSubjects.length > 0 && (
            <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 rounded-2xl p-6 border border-slate-700">
              <h3 className="font-semibold text-white mb-3">Session Summary</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSubjects.map((subject) => (
                  <span key={subject.id} className="px-3 py-1.5 rounded-full bg-violet-900/50 text-violet-300 text-sm font-medium flex items-center gap-1">
                    <span>{subject.icon}</span>
                    {subject.name}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-6 text-slate-300">
                <div>
                  <p className="text-sm text-slate-400">Total Questions</p>
                  <p className="text-2xl font-bold text-violet-400">{selectedSubjects.length * questionsPerSubject}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Subjects</p>
                  <p className="text-2xl font-bold text-violet-400">{selectedSubjects.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Timer</p>
                  <p className="text-2xl font-bold text-green-400">None</p>
                </div>
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStartStudy}
            disabled={selectedSubjects.length === 0 || isLoading}
            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl hover:from-violet-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading {loadingProgress.subject || 'questions'}...</span>
                </div>
                {loadingProgress.total > 0 && (
                  <div className="w-full mt-2 bg-violet-800 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Studying
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
