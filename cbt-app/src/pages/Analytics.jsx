import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, TrendingUp, Award, Target, Clock,
  BarChart2, Calendar, BookOpen, Star, Trophy
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts'
import useStore from '../store/useStore'

const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

export default function Analytics() {
  const { practiceHistory, examHistory, studyHistory } = useStore()

  const allHistory = useMemo(() => {
    return [...practiceHistory, ...examHistory, ...studyHistory]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [practiceHistory, examHistory, studyHistory])

  const stats = useMemo(() => {
    if (allHistory.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        totalTime: 0,
        totalQuestions: 0,
        improvement: 0,
      }
    }

    const scores = allHistory.map(h => h.overallScore)
    const totalTime = allHistory.reduce((sum, h) => sum + (h.duration || 0), 0)
    const totalQuestions = allHistory.reduce((sum, h) => sum + (h.totalQuestions || 0), 0)
    
    const recentScores = scores.slice(-5)
    const oldScores = scores.slice(0, Math.max(1, Math.floor(scores.length / 2)))
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length
    const improvement = recentAvg - oldAvg

    return {
      totalSessions: allHistory.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      totalTime: Math.round(totalTime / 60),
      totalQuestions,
      improvement: Math.round(improvement),
    }
  }, [allHistory])

  const progressData = useMemo(() => {
    return allHistory.slice(-10).map((h, idx) => ({
      name: `#${idx + 1}`,
      score: h.overallScore,
      date: new Date(h.date).toLocaleDateString(),
    }))
  }, [allHistory])

  const subjectPerformance = useMemo(() => {
    const subjectScores = {}
    
    allHistory.forEach(h => {
      if (h.subjectResults) {
        Object.entries(h.subjectResults).forEach(([id, data]) => {
          if (!subjectScores[id]) {
            subjectScores[id] = { name: data.name, icon: data.icon, scores: [], total: 0, correct: 0 }
          }
          subjectScores[id].scores.push(data.score)
          subjectScores[id].total += data.total
          subjectScores[id].correct += data.correct
        })
      }
    })

    return Object.entries(subjectScores)
      .map(([id, data]) => ({
        id,
        name: data.name.length > 12 ? data.name.substring(0, 12) + '...' : data.name,
        fullName: data.name,
        icon: data.icon,
        averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        attempts: data.scores.length,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
  }, [allHistory])

  const modeDistribution = useMemo(() => {
    return [
      { name: 'Practice', value: practiceHistory.length, color: '#3b82f6' },
      { name: 'Full Exam', value: examHistory.length, color: '#22c55e' },
      { name: 'Study', value: studyHistory.length, color: '#8b5cf6' },
    ].filter(d => d.value > 0)
  }, [practiceHistory, examHistory, studyHistory])

  const getModeInfo = (mode) => {
    switch (mode) {
      case 'full':
        return { icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-900/50', label: 'Full Exam' }
      case 'study':
        return { icon: Star, color: 'text-violet-400', bg: 'bg-violet-900/50', label: 'Study' }
      default:
        return { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-900/50', label: 'Practice' }
    }
  }

  if (allHistory.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
              <p className="text-slate-400">Track your progress over time</p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Data Yet</h3>
            <p className="text-slate-400 mb-6">
              Complete some practice sessions or exams to see your analytics
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/study-setup" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors"
              >
                <Star className="w-5 h-5" />
                Start Studying
              </Link>
              <Link 
                to="/practice" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Start Practicing
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
              <p className="text-slate-400">Track your progress over time</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
                  <p className="text-xs text-slate-400">Sessions</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.averageScore}%</p>
                  <p className="text-xs text-slate-400">Average</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-900/50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.bestScore}%</p>
                  <p className="text-xs text-slate-400">Best</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalTime}m</p>
                  <p className="text-xs text-slate-400">Time</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-900/50 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalQuestions}</p>
                  <p className="text-xs text-slate-400">Questions</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  stats.improvement >= 0 ? 'bg-emerald-900/50' : 'bg-red-900/50'
                }`}>
                  <TrendingUp className={`w-5 h-5 ${
                    stats.improvement >= 0 ? 'text-emerald-400' : 'text-red-400 rotate-180'
                  }`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    stats.improvement >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {stats.improvement >= 0 ? '+' : ''}{stats.improvement}%
                  </p>
                  <p className="text-xs text-slate-400">Trend</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="font-semibold text-white mb-4">Score Progress</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="#475569" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {modeDistribution.length > 0 && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="font-semibold text-white mb-4">Session Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={modeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {modeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {modeDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-slate-400">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {subjectPerformance.length > 0 && (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="font-semibold text-white mb-4">Subject Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="#475569" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Bar 
                    dataKey="averageScore" 
                    fill="#10b981" 
                    radius={[0, 4, 4, 0]}
                    background={{ fill: '#1e293b' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="font-semibold text-white mb-4">Recent Sessions</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allHistory.slice().reverse().slice(0, 10).map((session) => {
                const modeInfo = getModeInfo(session.mode)
                const ModeIcon = modeInfo.icon
                return (
                  <div key={session.id} className="p-4 rounded-xl bg-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modeInfo.bg}`}>
                        <ModeIcon className={`w-5 h-5 ${modeInfo.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {session.mode === 'full' ? 'Full Exam' : session.subjects?.[0] || modeInfo.label}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.date).toLocaleDateString()}
                          <Clock className="w-3 h-3 ml-2" />
                          {Math.round(session.duration / 60)}m
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        session.overallScore >= 70 ? 'text-emerald-400' :
                        session.overallScore >= 50 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {session.overallScore}%
                      </p>
                      <p className="text-xs text-slate-400">
                        {session.totalCorrect}/{session.totalQuestions}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
