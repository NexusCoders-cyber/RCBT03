import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, CheckCircle, XCircle, MinusCircle, Home, Eye, RotateCcw, 
  Sparkles, TrendingUp, Award
} from 'lucide-react'
import useStore from '../store/useStore'

export default function ResultsModal() {
  const navigate = useNavigate()
  const { showResultsModal, pendingResult, closeResultsModal, resetExam } = useStore()

  if (!showResultsModal || !pendingResult) return null

  const {
    totalQuestions,
    totalCorrect,
    totalWrong,
    totalUnanswered,
    overallScore,
    subjectResults,
    mode,
  } = pendingResult

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreBg = (score) => {
    if (score >= 70) return 'from-emerald-500 to-teal-600'
    if (score >= 50) return 'from-amber-500 to-orange-600'
    return 'from-red-500 to-rose-600'
  }

  const getScoreMessage = (score) => {
    if (score >= 90) return { text: 'Outstanding!', icon: '🏆' }
    if (score >= 70) return { text: 'Great Job!', icon: '⭐' }
    if (score >= 50) return { text: 'Good Effort!', icon: '👍' }
    return { text: 'Keep Practicing!', icon: '💪' }
  }

  const scoreMessage = getScoreMessage(overallScore)

  const handleViewResults = () => {
    closeResultsModal()
    navigate('/results')
  }

  const handleReview = () => {
    closeResultsModal()
    navigate('/review')
  }

  const handleGoHome = () => {
    closeResultsModal()
    resetExam()
    navigate('/')
  }

  const handleRetry = () => {
    closeResultsModal()
    resetExam()
    if (mode === 'study') {
      navigate('/study-setup')
    } else if (mode === 'full') {
      navigate('/exam-setup')
    } else {
      navigate('/practice')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-slate-800 rounded-3xl max-w-md w-full overflow-hidden border border-slate-700 shadow-2xl"
        >
          <div className={`bg-gradient-to-br ${getScoreBg(overallScore)} p-8 text-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20">
              <Sparkles className="absolute top-4 left-4 w-8 h-8 text-white animate-pulse" />
              <Sparkles className="absolute bottom-4 right-4 w-6 h-6 text-white animate-pulse" />
              <Award className="absolute top-8 right-8 w-10 h-10 text-white animate-pulse" />
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="relative z-10"
            >
              <span className="text-6xl block mb-2">{scoreMessage.icon}</span>
              <h2 className="text-2xl font-bold text-white mb-1">{scoreMessage.text}</h2>
              <p className="text-white/80 text-sm mb-4">
                {mode === 'study' ? 'Study Session' : mode === 'full' ? 'Full Exam' : 'Practice'} Complete
              </p>
              
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.4 }}
                className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30"
              >
                <div>
                  <p className="text-5xl font-bold text-white">{overallScore}</p>
                  <p className="text-white/80 text-sm">percent</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-900/30 rounded-xl p-3 text-center border border-green-800/50">
                <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-400">{totalCorrect}</p>
                <p className="text-xs text-green-300">Correct</p>
              </div>
              <div className="bg-red-900/30 rounded-xl p-3 text-center border border-red-800/50">
                <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-400">{totalWrong}</p>
                <p className="text-xs text-red-300">Wrong</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-3 text-center border border-slate-600">
                <MinusCircle className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-slate-400">{totalUnanswered}</p>
                <p className="text-xs text-slate-400">Skipped</p>
              </div>
            </div>

            {Object.keys(subjectResults || {}).length > 1 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-400 mb-2">Subject Breakdown</p>
                {Object.entries(subjectResults).slice(0, 4).map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{data.icon}</span>
                      <span className="text-sm text-white truncate max-w-32">{data.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(data.score)}`}
                          style={{ width: `${data.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(data.score)}`}>
                        {data.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoHome}
                className="py-3 px-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={handleReview}
                className="py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Review
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleViewResults}
                className="py-3 px-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Details
              </button>
              <button
                onClick={handleRetry}
                className="py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
