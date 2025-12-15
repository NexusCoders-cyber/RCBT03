import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Clock, CheckCircle, XCircle, BookOpen, Trophy, Star, Calendar, ChevronRight, ChevronLeft, FileText, ArrowLeft } from 'lucide-react'
import useStore from '../store/useStore'

export default function SavedSessions({ isOpen, onClose }) {
  const { savedSessions, deleteSavedSession, clearAllSavedSessions } = useStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [viewMode, setViewMode] = useState('list')

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
      setViewMode('list')
    }
  }

  const handleClearAll = () => {
    clearAllSavedSessions()
    setShowClearAllConfirm(false)
    setSelectedSession(null)
    setViewMode('list')
  }

  const handleSelectSession = (session) => {
    setSelectedSession(session)
    setViewMode('details')
  }

  const handleBackToList = () => {
    setViewMode('list')
  }

  const renderQuestionReview = () => {
    if (!selectedSession?.questionDetails) return null

    return (
      <div className="space-y-4">
        {selectedSession.questionDetails.map((question, idx) => {
          const isCorrect = question.status === 'correct'
          const isUnanswered = question.status === 'unanswered'
          
          return (
            <div 
              key={question.id || idx}
              className={`p-4 rounded-xl border ${
                isCorrect 
                  ? 'bg-green-900/20 border-green-800/50' 
                  : isUnanswered
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-red-900/20 border-red-800/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-slate-400">Question {idx + 1}</span>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  isCorrect ? 'text-green-400' : isUnanswered ? 'text-slate-400' : 'text-red-400'
                }`}>
                  {isCorrect ? (
                    <><CheckCircle className="w-4 h-4" /> Correct</>
                  ) : isUnanswered ? (
                    <><Clock className="w-4 h-4" /> Unanswered</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Wrong</>
                  )}
                </span>
              </div>
              
              <div 
                className="text-white mb-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: question.question }}
              />
              
              <div className="space-y-2 mb-4">
                {Object.entries(question.options || {}).map(([key, value]) => {
                  if (!value) return null
                  const isUserAnswer = question.userAnswer === key
                  const isCorrectAnswer = question.answer === key
                  
                  let optionClass = 'border-slate-700 bg-slate-800/30'
                  if (isCorrectAnswer) {
                    optionClass = 'border-green-500 bg-green-900/30'
                  } else if (isUserAnswer && !isCorrect) {
                    optionClass = 'border-red-500 bg-red-900/30'
                  }
                  
                  return (
                    <div key={key} className={`p-3 rounded-lg border ${optionClass} flex items-start gap-3`}>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isCorrectAnswer 
                          ? 'bg-green-500 text-white' 
                          : isUserAnswer && !isCorrect 
                            ? 'bg-red-500 text-white' 
                            : 'bg-slate-700 text-slate-300'
                      }`}>
                        {key.toUpperCase()}
                      </span>
                      <span 
                        className="text-slate-300 text-sm pt-0.5"
                        dangerouslySetInnerHTML={{ __html: value }}
                      />
                    </div>
                  )
                })}
              </div>
              
              {question.solution && (
                <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-800/50">
                  <p className="text-sm font-semibold text-blue-300 mb-1">Explanation</p>
                  <p 
                    className="text-sm text-blue-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: question.solution }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
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
          className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-teal-900/50 to-emerald-900/50">
            <div className="flex items-center gap-3">
              {viewMode === 'details' && (
                <button
                  onClick={handleBackToList}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-teal-600/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {viewMode === 'details' ? 'Session Review' : 'Saved Sessions'}
                </h2>
                <p className="text-sm text-slate-400">
                  {viewMode === 'details' 
                    ? `${selectedSession?.totalQuestions || 0} questions` 
                    : `${savedSessions?.length || 0} sessions saved`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {viewMode === 'list' && savedSessions?.length > 0 && (
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

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {viewMode === 'list' ? (
              <>
                {(!savedSessions || savedSessions.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Saved Sessions</h3>
                    <p className="text-slate-400 text-sm">Complete exams and save your results to review them later.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {savedSessions.map((session) => {
                      const modeInfo = getModeInfo(session.mode)
                      const ModeIcon = modeInfo.icon
                      
                      return (
                        <motion.div
                          key={session.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => handleSelectSession(session)}
                          className="relative p-4 rounded-xl cursor-pointer transition-all bg-slate-700/50 border border-slate-600 hover:border-emerald-500/50 hover:bg-slate-700"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${modeInfo.bg}`}>
                              <ModeIcon className={`w-7 h-7 ${modeInfo.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate text-lg">
                                {session.name || (session.mode === 'full' ? 'Full Exam' : session.subjects?.[0] || modeInfo.label)}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDate(session.savedAt)}</span>
                                <span className="mx-1">|</span>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{Math.round((session.duration || 0) / 60)} mins</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${getScoreColor(session.overallScore)}`}>
                                {session.overallScore}%
                              </p>
                              <p className="text-sm text-slate-400">
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
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-600/50 text-slate-400 hover:bg-red-900/50 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4">
                {selectedSession && (
                  <>
                    <div className="mb-6">
                      <div className="text-center py-4 mb-4">
                        <p className={`text-6xl font-bold ${getScoreColor(selectedSession.overallScore)}`}>
                          {selectedSession.overallScore}%
                        </p>
                        <p className="text-slate-400 mt-2">Overall Score</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-900/30 rounded-xl p-4 text-center border border-green-800/50">
                          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-400">{selectedSession.totalCorrect}</p>
                          <p className="text-sm text-green-300">Correct</p>
                        </div>
                        <div className="bg-red-900/30 rounded-xl p-4 text-center border border-red-800/50">
                          <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-red-400">{selectedSession.totalWrong}</p>
                          <p className="text-sm text-red-300">Wrong</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-xl p-4 text-center border border-slate-600">
                          <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-slate-300">{selectedSession.totalUnanswered || 0}</p>
                          <p className="text-sm text-slate-400">Skipped</p>
                        </div>
                      </div>

                      {selectedSession.subjectResults && Object.keys(selectedSession.subjectResults).length > 0 && (
                        <div className="mb-6">
                          <p className="text-sm font-semibold text-slate-400 mb-3">Subject Breakdown</p>
                          <div className="space-y-2">
                            {Object.entries(selectedSession.subjectResults).map(([id, data]) => (
                              <div key={id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                                <span className="text-white font-medium">{data.name}</span>
                                <div className="flex items-center gap-3">
                                  <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
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
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-700 pt-4">
                      <h3 className="text-lg font-bold text-white mb-4">Question Review</h3>
                      {renderQuestionReview()}
                    </div>
                  </>
                )}
              </div>
            )}
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
