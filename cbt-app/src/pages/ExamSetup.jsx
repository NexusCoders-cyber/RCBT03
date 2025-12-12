import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, AlertCircle, Play, Loader2, Info } from 'lucide-react'
import useStore from '../store/useStore'
import { loadQuestionsForExam } from '../services/api'

const EXAM_DURATION = 120

export default function ExamSetup() {
  const navigate = useNavigate()
  const { subjects, startFullExamMode, addNotification, isOnline } = useStore()

  const english = subjects.find(s => s.id === 'english')
  const otherSubjects = subjects.filter(s => s.id !== 'english')

  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0, subject: '' })

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => {
      if (prev.find(s => s.id === subject.id)) {
        return prev.filter(s => s.id !== subject.id)
      }
      if (prev.length >= 3) {
        return prev
      }
      return [...prev, subject]
    })
    setError(null)
  }

  const isSubjectSelected = (subjectId) => {
    return selectedSubjects.some(s => s.id === subjectId)
  }

  const handleStartExam = async () => {
    if (selectedSubjects.length !== 3) {
      setError('Please select exactly 3 subjects (English is compulsory)')
      return
    }

    setIsLoading(true)
    setError(null)
    setLoadingProgress({ loaded: 0, total: 4, subject: 'Starting...' })

    try {
      const allSubjects = [english, ...selectedSubjects]
      
      const questionsMap = await loadQuestionsForExam(allSubjects, (progress) => {
        setLoadingProgress(progress)
      })

      const totalQuestions = Object.values(questionsMap).reduce((sum, q) => sum + q.length, 0)
      
      if (totalQuestions < 100) {
        if (!isOnline) {
          addNotification({
            type: 'warning',
            title: 'Limited Questions',
            message: 'Some questions may be unavailable offline. Try again when online.',
          })
        }
        throw new Error('Could not load enough questions. Please try again or check your connection.')
      }

      addNotification({
        type: 'success',
        title: 'Exam Started',
        message: `${totalQuestions} questions loaded. Good luck!`,
      })

      startFullExamMode(allSubjects, questionsMap, EXAM_DURATION)
      navigate('/exam')
    } catch (err) {
      setError(err.message || 'Failed to load exam questions. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
            <div>
              <h1 className="text-2xl font-bold text-white">Full Exam Mode</h1>
              <p className="text-slate-400">JAMB UTME Simulation</p>
            </div>
          </div>

          <div className="bg-blue-900/30 rounded-2xl p-5 border border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-100 mb-1">JAMB Exam Rules</p>
                <ul className="text-blue-200 space-y-1">
                  <li>• <strong>4 subjects</strong> total (English is compulsory)</li>
                  <li>• <strong>English:</strong> 60 questions</li>
                  <li>• <strong>Other 3 subjects:</strong> 40 questions each</li>
                  <li>• <strong>Total:</strong> 180 questions in 2 hours</li>
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
            <h2 className="text-lg font-semibold text-white mb-4">
              Compulsory Subject
            </h2>
            <div className="p-4 rounded-xl bg-emerald-900/30 border-2 border-emerald-600">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{english?.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white">{english?.name}</p>
                  <p className="text-sm text-emerald-300">60 questions (compulsory)</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Select 3 More Subjects
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedSubjects.length === 3
                  ? 'bg-emerald-900/50 text-emerald-300'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {selectedSubjects.length}/3 selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {otherSubjects.map((subject) => {
                const isSelected = isSubjectSelected(subject.id)
                const isDisabled = !isSelected && selectedSubjects.length >= 3
                
                return (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject)}
                    disabled={isDisabled}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left relative
                      ${isSelected
                        ? 'border-emerald-500 bg-emerald-900/30'
                        : isDisabled
                          ? 'border-slate-700 opacity-50 cursor-not-allowed'
                          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                      }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-2xl block mb-1">{subject.icon}</span>
                    <span className="font-medium text-sm text-white">{subject.name}</span>
                    <span className="block text-xs text-slate-400 mt-1">40 questions</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Selected Subjects</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{english?.icon}</span>
                  <span className="font-medium text-white">{english?.name}</span>
                </div>
                <span className="text-sm font-medium text-emerald-400">60 questions</span>
              </div>
              {selectedSubjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{subject.icon}</span>
                    <span className="font-medium text-white">{subject.name}</span>
                  </div>
                  <span className="text-sm font-medium text-emerald-400">40 questions</span>
                </div>
              ))}
              {selectedSubjects.length < 3 && (
                <div className="p-3 rounded-xl border-2 border-dashed border-slate-600 text-center">
                  <p className="text-slate-400 text-sm">
                    Select {3 - selectedSubjects.length} more subject{3 - selectedSubjects.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-2xl p-6 border border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-300">Total Questions</p>
                <p className="text-3xl font-bold text-emerald-400">180</p>
              </div>
              <div>
                <p className="font-semibold text-slate-300">Duration</p>
                <p className="text-3xl font-bold text-emerald-400">2 hours</p>
              </div>
              <div>
                <p className="font-semibold text-slate-300">Subjects</p>
                <p className="text-3xl font-bold text-emerald-400">4</p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStartExam}
            disabled={selectedSubjects.length !== 3 || isLoading}
            className="w-full py-4 text-lg font-semibold bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading {loadingProgress.subject || 'questions'}...</span>
                </div>
                {loadingProgress.total > 0 && (
                  <div className="w-full mt-2 bg-emerald-800 rounded-full h-2">
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
                Start Full Exam
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
