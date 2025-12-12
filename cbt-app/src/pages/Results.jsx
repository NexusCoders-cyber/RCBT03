import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Trophy, Target, Clock, RotateCcw, Home, Eye,
  CheckCircle, XCircle, MinusCircle, TrendingUp
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts'
import useStore from '../store/useStore'

const COLORS = ['#22c55e', '#ef4444', '#64748b']

export default function Results() {
  const navigate = useNavigate()
  const { currentExam, resetExam, questions, answers } = useStore()

  useEffect(() => {
    if (!currentExam) {
      navigate('/')
    }
  }, [currentExam, navigate])

  if (!currentExam) return null

  const {
    totalQuestions,
    totalCorrect,
    totalWrong,
    totalUnanswered,
    overallScore,
    subjectResults,
    duration,
    mode,
    subjects: examSubjects,
  } = currentExam

  const pieData = [
    { name: 'Correct', value: totalCorrect },
    { name: 'Wrong', value: totalWrong },
    { name: 'Unanswered', value: totalUnanswered },
  ]

  const barData = Object.entries(subjectResults || {}).map(([id, data]) => ({
    name: data.name.length > 10 ? data.name.substring(0, 10) + '...' : data.name,
    score: data.score,
    correct: data.correct,
    total: data.total,
  }))

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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleRetry = () => {
    resetExam()
    navigate(mode === 'full' ? '/exam-setup' : '/practice')
  }

  const handleReview = () => {
    navigate('/review')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg shadow-orange-500/30"
            >
              <Trophy className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Exam Complete!
            </h1>
            <p className="text-slate-400">
              {mode === 'full' ? 'Full JAMB Exam' : 'Practice Session'} Results
            </p>
          </div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`rounded-2xl p-8 text-center bg-gradient-to-br ${getScoreBg(overallScore)} text-white shadow-xl`}
          >
            <p className="text-lg opacity-90 mb-2">Your Score</p>
            <p className="text-7xl font-bold mb-2">{overallScore}%</p>
            <p className="text-lg opacity-90">
              {totalCorrect} out of {totalQuestions} correct
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{totalCorrect}</p>
              <p className="text-xs text-slate-400">Correct</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-red-900/50 flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">{totalWrong}</p>
              <p className="text-xs text-slate-400">Wrong</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center mx-auto mb-2">
                <MinusCircle className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-400">{totalUnanswered}</p>
              <p className="text-xs text-slate-400">Skipped</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{formatDuration(duration)}</p>
              <p className="text-xs text-slate-400">Time Taken</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="font-semibold text-white mb-4">Score Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm text-slate-400">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(subjectResults || {}).length > 1 && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="font-semibold text-white mb-4">Subject Performance</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="#475569" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {Object.keys(subjectResults || {}).length > 0 && (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="font-semibold text-white mb-4">Subject Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(subjectResults).map(([id, data]) => (
                  <div key={id} className="p-4 rounded-xl bg-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{data.name}</span>
                      <span className={`font-bold ${getScoreColor(data.score)}`}>{data.score}%</span>
                    </div>
                    <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(data.score)}`}
                        style={{ width: `${data.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                      <span>{data.correct}/{data.total} correct</span>
                      <span>{data.wrong} wrong, {data.unanswered} skipped</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <button
              onClick={() => { resetExam(); navigate('/'); }}
              className="py-3 px-6 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Home
            </button>
            <button
              onClick={handleReview}
              className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Review Answers
            </button>
            <button
              onClick={handleRetry}
              className="py-3 px-6 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
