import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Bookmark, Trash2, BookOpen, X, Check, AlertCircle } from 'lucide-react'
import useStore from '../store/useStore'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export default function Bookmarks() {
  const navigate = useNavigate()
  const { bookmarkedQuestions, removeBookmark, subjects } = useStore()
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const getSubjectInfo = (subjectId) => {
    return subjects.find(s => s.id === subjectId) || { name: 'Unknown', icon: '📚' }
  }

  const handleRemoveBookmark = (questionId) => {
    removeBookmark(questionId)
    setConfirmDelete(null)
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Bookmarks</h1>
              <p className="text-slate-400">
                {bookmarkedQuestions.length} saved question{bookmarkedQuestions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {bookmarkedQuestions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <Bookmark className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Bookmarks Yet</h3>
              <p className="text-slate-400 mb-6">
                Save questions during practice to review them later
              </p>
              <button
                onClick={() => navigate('/practice')}
                className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors"
              >
                Start Practicing
              </button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {bookmarkedQuestions.map((question) => {
                const subjectInfo = getSubjectInfo(question.subject || question.subjectId)
                
                return (
                  <motion.div
                    key={question.id}
                    variants={itemVariants}
                    className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700"
                  >
                    <div 
                      className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => {
                        setSelectedQuestion(selectedQuestion?.id === question.id ? null : question)
                        setShowAnswer(false)
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{subjectInfo.icon}</span>
                            <span className="text-sm font-medium text-slate-400">{subjectInfo.name}</span>
                            {question.examyear && (
                              <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                                {question.examyear}
                              </span>
                            )}
                          </div>
                          <p 
                            className="text-white line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: question.question }}
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete(question.id)
                          }}
                          className="p-2 rounded-lg hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedQuestion?.id === question.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-700"
                        >
                          <div className="p-4 space-y-4">
                            <div 
                              className="text-white"
                              dangerouslySetInnerHTML={{ __html: question.question }}
                            />
                            
                            {question.image && (
                              <div className="rounded-xl overflow-hidden bg-slate-700/50 p-2">
                                <img 
                                  src={question.image} 
                                  alt="Question diagram" 
                                  className="max-w-full h-auto mx-auto rounded-lg"
                                />
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              {Object.entries(question.options || {}).map(([key, value]) => {
                                if (!value) return null
                                const isCorrect = key === question.answer
                                
                                return (
                                  <div
                                    key={key}
                                    className={`p-3 rounded-xl flex items-start gap-3 ${
                                      showAnswer && isCorrect 
                                        ? 'bg-emerald-900/30 border border-emerald-700' 
                                        : 'bg-slate-700/50'
                                    }`}
                                  >
                                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                      showAnswer && isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-600 text-slate-300'
                                    }`}>
                                      {key.toUpperCase()}
                                    </span>
                                    <span 
                                      className="text-slate-200 flex-1"
                                      dangerouslySetInnerHTML={{ __html: value }}
                                    />
                                    {showAnswer && isCorrect && (
                                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            
                            <button
                              onClick={() => setShowAnswer(!showAnswer)}
                              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                                showAnswer 
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
                              }`}
                            >
                              {showAnswer ? 'Hide Answer' : 'Show Answer'}
                            </button>
                            
                            {showAnswer && question.solution && (
                              <div className="p-4 rounded-xl bg-blue-900/30 border border-blue-800">
                                <p className="text-sm font-medium text-blue-400 mb-2">Explanation:</p>
                                <p 
                                  className="text-slate-300"
                                  dangerouslySetInnerHTML={{ __html: question.solution }}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Remove Bookmark?</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveBookmark(confirmDelete)}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
