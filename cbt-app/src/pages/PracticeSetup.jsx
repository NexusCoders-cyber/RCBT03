import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Calendar, Play, Loader2, AlertCircle, Hash } from 'lucide-react'
import useStore from '../store/useStore'
import { loadPracticeQuestions } from '../services/api'

export default function PracticeSetup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { subjects, years, timerEnabled, startPracticeMode } = useStore()

  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedYear, setSelectedYear] = useState('random')
  const [questionCount, setQuestionCount] = useState(40)
  const [duration, setDuration] = useState(30)
  const [useTimer, setUseTimer] = useState(timerEnabled)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAllYears, setShowAllYears] = useState(false)

  useEffect(() => {
    const subjectParam = searchParams.get('subject')
    if (subjectParam) {
      const subject = subjects.find(s => s.id === subjectParam)
      if (subject) {
        setSelectedSubject(subject)
      } else {
        navigate('/practice')
      }
    } else {
      navigate('/practice')
    }
  }, [searchParams, subjects, navigate])

  const handleStartPractice = async () => {
    if (!selectedSubject) return

    setIsLoading(true)
    setError(null)

    try {
      const year = selectedYear === 'random' ? null : selectedYear
      const questions = await loadPracticeQuestions(selectedSubject, questionCount, year)

      if (questions.length === 0) {
        throw new Error('No questions available for this subject')
      }

      startPracticeMode(
        selectedSubject,
        year,
        questions,
        useTimer ? duration : 0
      )

      navigate('/exam')
    } catch (err) {
      setError(err.message || 'Failed to load questions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const displayedYears = showAllYears ? years : years.slice(0, 15)

  if (!selectedSubject) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/practice')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${selectedSubject.color}20` }}
              >
                {selectedSubject.icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{selectedSubject.name}</h1>
                <p className="text-slate-400 text-sm">Configure your practice session</p>
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
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Select Year
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              <button
                onClick={() => setSelectedYear('random')}
                className={`p-3 rounded-xl font-medium transition-all duration-200 col-span-2
                  ${selectedYear === 'random'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                Random Mix
              </button>
              {displayedYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`p-3 rounded-xl font-medium transition-all duration-200
                    ${selectedYear === year
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {year}
                </button>
              ))}
            </div>
            {years.length > 15 && (
              <button
                onClick={() => setShowAllYears(!showAllYears)}
                className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {showAllYears ? 'Show less' : `Show all ${years.length} years`}
              </button>
            )}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-emerald-400" />
              Number of Questions
            </h2>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 30, 40, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200
                    ${questionCount === count
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Timer Settings
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTimer}
                  onChange={(e) => setUseTimer(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-emerald-600 peer-focus:ring-4 peer-focus:ring-emerald-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            
            {useTimer && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-wrap gap-2"
              >
                {[15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDuration(mins)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200
                      ${duration === mins
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStartPractice}
            disabled={!selectedSubject || isLoading}
            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Questions...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Practice
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
