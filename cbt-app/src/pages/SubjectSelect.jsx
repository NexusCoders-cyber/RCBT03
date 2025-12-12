import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, BookOpen, Calculator, Download, CheckCircle, Loader2 } from 'lucide-react'
import useStore from '../store/useStore'
import { alocAPI } from '../services/api'

const subjectCategories = {
  sciences: {
    name: 'Sciences',
    subjects: ['physics', 'chemistry', 'biology', 'mathematics']
  },
  arts: {
    name: 'Arts & Humanities',
    subjects: ['english', 'literature', 'history', 'crk', 'irk']
  },
  social: {
    name: 'Social Sciences',
    subjects: ['economics', 'government', 'geography', 'commerce']
  },
  commercial: {
    name: 'Commercial',
    subjects: ['accounting', 'commerce', 'economics']
  }
}

export default function SubjectSelect() {
  const navigate = useNavigate()
  const { subjects } = useStore()
  const [offlineStatus, setOfflineStatus] = useState({})
  const [downloadingSubject, setDownloadingSubject] = useState(null)
  const [viewMode, setViewMode] = useState('all')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await alocAPI.getStats()
      if (data) {
        setStats(data)
        const status = {}
        Object.entries(data.subjects || {}).forEach(([subject, count]) => {
          status[subject] = count >= 40
        })
        setOfflineStatus(status)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleSubjectClick = (subject) => {
    navigate(`/practice-setup?subject=${subject.id}`)
  }

  const handleDownload = async (subject, e) => {
    e.stopPropagation()
    setDownloadingSubject(subject.id)
    try {
      await alocAPI.syncQuestions(subject.id, 100)
      await loadStats()
    } catch (error) {
      console.error('Download error:', error)
    } finally {
      setDownloadingSubject(null)
    }
  }

  const getSubjectGradient = (color) => {
    const gradients = {
      '#9CA3AF': 'from-gray-500 to-gray-700',
      '#A855F7': 'from-purple-500 to-purple-700',
      '#EAB308': 'from-yellow-500 to-amber-600',
      '#22C55E': 'from-green-500 to-emerald-600',
      '#EC4899': 'from-pink-500 to-rose-600',
      '#F97316': 'from-orange-500 to-orange-700',
      '#EF4444': 'from-red-500 to-red-700',
      '#14B8A6': 'from-teal-500 to-teal-700',
      '#6366F1': 'from-indigo-500 to-indigo-700',
      '#06B6D4': 'from-cyan-500 to-cyan-700',
      '#F59E0B': 'from-amber-500 to-amber-700',
      '#10B981': 'from-emerald-500 to-emerald-700',
      '#84CC16': 'from-lime-500 to-green-600',
      '#A16207': 'from-amber-700 to-yellow-800'
    }
    return gradients[color] || 'from-slate-500 to-slate-700'
  }

  const filteredSubjects = viewMode === 'all' 
    ? subjects 
    : subjects.filter(s => {
        const category = subjectCategories[viewMode]
        return category && category.subjects.includes(s.id)
      })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-all duration-200 border border-slate-700/50"
              >
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Practice Mode</h1>
                <p className="text-slate-400 text-sm">Choose a subject to start practicing</p>
              </div>
            </div>
            {stats && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">
                  {stats.total || 0} questions available
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Subjects' },
              { key: 'sciences', label: 'Sciences' },
              { key: 'arts', label: 'Arts' },
              { key: 'social', label: 'Social Sciences' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setViewMode(filter.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  viewMode === filter.key
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredSubjects.map((subject, index) => {
              const isReady = offlineStatus[subject.id]
              const isDownloading = downloadingSubject === subject.id
              const questionCount = stats?.subjects?.[subject.id] || 0
              
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <div 
                    onClick={() => handleSubjectClick(subject)}
                    className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${getSubjectGradient(subject.color)} opacity-90`} />
                    
                    <div className="absolute inset-0 bg-black/20" />
                    
                    <div className="relative p-5 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner">
                            {subject.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg leading-tight">
                              {subject.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {subject.isCalculation ? (
                                <span className="flex items-center gap-1 text-xs text-white/70">
                                  <Calculator className="w-3 h-3" />
                                  Calculation
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-white/70">
                                  <BookOpen className="w-3 h-3" />
                                  Theory
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isReady ? (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium text-white">
                                <CheckCircle className="w-3 h-3" />
                                {questionCount} questions
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium text-white/70">
                                {questionCount > 0 ? `${questionCount} questions` : 'Ready to download'}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => handleDownload(subject, e)}
                            disabled={isDownloading}
                            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all mt-4" />
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                      <div 
                        className="h-full bg-white/40 transition-all duration-500"
                        style={{ width: `${Math.min((questionCount / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-5 border border-emerald-500/20"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Offline Mode</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Download questions for each subject to practice without internet connection
                </p>
                <button
                  onClick={async () => {
                    setDownloadingSubject('all')
                    try {
                      await alocAPI.syncQuestions(null, 100)
                      await loadStats()
                    } catch (error) {
                      console.error('Bulk download error:', error)
                    } finally {
                      setDownloadingSubject(null)
                    }
                  }}
                  disabled={downloadingSubject === 'all'}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {downloadingSubject === 'all' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download All Subjects
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
