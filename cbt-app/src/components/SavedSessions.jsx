import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Clock, CheckCircle, XCircle, BookOpen, Trophy, Star, Calendar, ChevronRight, Download, FileText } from 'lucide-react'
import useStore from '../store/useStore'

export default function SavedSessions({ isOpen, onClose }) {
  const { savedSessions, deleteSavedSession, clearAllSavedSessions } = useStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)

  if (!isOpen) return null

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

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = (id) => {
    deleteSavedSession(id)
    setShowDeleteConfirm(null)
    if (selectedSession?.id === id) {
      setSelectedSession(null)
    }
  }

  const handleClearAll = () => {
    clearAllSavedSessions()
    setShowClearAllConfirm(false)
    setSelectedSession(null)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-teal-900/50 to-emerald-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600/30 flex items-center justify-center">
                <Download className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Saved Sessions</h2>
                <p className="text-sm text-slate-400">{savedSessions?.length || 0} sessions saved</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {savedSessions?.length > 0 && (
                <button
                  onClick={() => setShowClearAllConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-sm font-medium hover:bg-red-900/50 transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex h-[calc(85vh-80px)]">
            <div className="w-full md:w-1/2 border-r border-slate-700 overflow-y-auto">
              {(!savedSessions || savedSessions.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Saved Sessions</h3>
                  <p className="text-slate-400 text-sm">Complete exams and save your results to review them later.</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {savedSessions.map((session) => {
                    const modeInfo = getModeInfo(session.mode)
                    const ModeIcon = modeInfo.icon
                    const isSelected = selectedSession?.id === session.id
                    
                    return (
                      <motion.div
                        key={session.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedSession(session)}
                        className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-emerald-900/40 border-2 border-emerald-500/50' 
                            : 'bg-slate-700/50 border border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${modeInfo.bg}`}>
                            <ModeIcon className={`w-6 h-6 ${modeInfo.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">
                              {session.name || (session.mode === 'full' ? 'Full Exam' : session.subjects?.[0] || modeInfo.label)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(session.savedAt)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${getScoreColor(session.overallScore)}`}>
                              {session.overallScore}%
                            </p>
                            <p className="text-xs text-slate-400">
                              {session.totalCorrect}/{session.totalQuestions}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowDeleteConfirm(session.id)
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-600/50 text-slate-400 hover:bg-red-900/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          style={{ opacity: 1 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="hidden md:block w-1/2 overflow-y-auto bg-slate-900/50">
              {selectedSession ? (
                <div className="p-4 space-y-4">
                  <div className="text-center py-4">
                    <p className={`text-5xl font-bold ${getScoreColor(selectedSession.overallScore)}`}>
                      {selectedSession.overallScore}%
                    </p>
                    <p className="text-slate-400 mt-1">Overall Score</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-900/30 rounded-xl p-3 text-center border border-green-800/50">
                      <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-green-400">{selectedSession.totalCorrect}</p>
                      <p className="text-xs text-green-300">Correct</p>
                    </div>
                    <div className="bg-red-900/30 rounded-xl p-3 text-center border border-red-800/50">
                      <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-red-400">{selectedSession.totalWrong}</p>
                      <p className="text-xs text-red-300">Wrong</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-3 text-center border border-slate-600">
                      <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-slate-300">{Math.round((selectedSession.duration || 0) / 60)}</p>
                      <p className="text-xs text-slate-400">Minutes</p>
                    </div>
                  </div>

                  {selectedSession.subjectResults && Object.keys(selectedSession.subjectResults).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-400">Subject Breakdown</p>
                      {Object.entries(selectedSession.subjectResults).map(([id, data]) => (
                        <div key={id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{data.icon}</span>
                            <span className="text-sm text-white">{data.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-600 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  data.score >= 70 ? 'bg-emerald-500' :
                                  data.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${data.score}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold w-12 text-right ${getScoreColor(data.score)}`}>
                              {data.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => setShowDeleteConfirm(selectedSession.id)}
                      className="w-full py-3 bg-red-900/30 text-red-400 font-semibold rounded-xl hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Session
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <p className="text-slate-500">Select a session to view details</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Delete Session?</h3>
                <p className="text-slate-400 text-sm mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showClearAllConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowClearAllConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Clear All Sessions?</h3>
                <p className="text-slate-400 text-sm mb-6">All {savedSessions?.length || 0} saved sessions will be permanently deleted.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearAllConfirm(false)}
                    className="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
