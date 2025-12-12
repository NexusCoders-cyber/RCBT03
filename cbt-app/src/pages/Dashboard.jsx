import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Rocket, BookOpen, TrendingUp, 
  Trophy, GraduationCap, Bookmark, ChevronRight, Sparkles, Book,
  User, Flame, Star, WifiOff, Wifi, Download, Brain, Bot
} from 'lucide-react'
import useStore from '../store/useStore'
import Dictionary from '../components/Dictionary'
import Flashcards from '../components/Flashcards'
import AIAssistant from '../components/AIAssistant'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const FeatureCard = ({ to, icon: Icon, title, description, bgColor, textColor, iconBg, badge, onClick }) => {
  const content = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${bgColor} rounded-2xl p-5 h-full transition-all duration-300 hover:shadow-lg relative overflow-hidden`}
    >
      {badge && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-yellow-500 text-yellow-900 text-xs font-bold">
          {badge}
        </span>
      )}
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-6 h-6 ${textColor}`} />
      </div>
      <h3 className={`font-bold ${textColor} text-lg mb-1`}>{title}</h3>
      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{description}</p>
    </motion.div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="block group text-left w-full">
        {content}
      </button>
    )
  }

  return (
    <Link to={to} className="block group">
      {content}
    </Link>
  )
}

export default function Dashboard() {
  const { 
    practiceHistory, 
    examHistory, 
    studyHistory,
    bookmarkedQuestions, 
    userProfile, 
    isOnline,
  } = useStore()
  const [showDictionary, setShowDictionary] = useState(false)
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [cachedCount, setCachedCount] = useState(0)

  useEffect(() => {
    const checkCachedQuestions = async () => {
      try {
        const request = indexedDB.open('jamb-cbt-offline', 1)
        request.onsuccess = (event) => {
          const db = event.target.result
          if (db.objectStoreNames.contains('questions')) {
            const transaction = db.transaction('questions', 'readonly')
            const store = transaction.objectStore('questions')
            const countRequest = store.count()
            countRequest.onsuccess = () => {
              setCachedCount(countRequest.result * 40)
            }
          }
        }
      } catch {
        setCachedCount(0)
      }
    }
    checkCachedQuestions()
  }, [])

  const recentExams = [...practiceHistory, ...examHistory, ...studyHistory]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)

  const totalSessions = practiceHistory.length + examHistory.length + studyHistory.length
  const totalQuestionsPracticed = recentExams.reduce((sum, e) => sum + e.totalQuestions, 0)
  const averageScore = recentExams.length > 0
    ? Math.round(recentExams.reduce((sum, e) => sum + e.overallScore, 0) / recentExams.length)
    : 0

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

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 p-6">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span className="text-white/90 text-sm font-medium">
                    {averageScore > 0 ? `SCORE: ${averageScore}%` : 'Start practicing!'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <div className="flex items-center gap-1 text-green-300 text-xs">
                      <Wifi className="w-4 h-4" />
                      <span>Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-300 text-xs">
                      <WifiOff className="w-4 h-4" />
                      <span>Offline</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30 hover:border-white transition-colors">
                    {userProfile.avatar ? (
                      <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-white" />
                    )}
                  </div>
                </Link>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Hi, {userProfile.name || 'Student'}!
                  </h2>
                  <p className="text-white/80 text-sm">Master your UTME preparation</p>
                </div>
              </div>
              {userProfile.streakDays > 0 && (
                <div className="mt-3 flex items-center gap-2 text-orange-300">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{userProfile.streakDays} day streak!</span>
                </div>
              )}
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20">
              <GraduationCap className="w-32 h-32 text-white" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <FeatureCard
              to="/study-setup"
              icon={Star}
              title="Study Mode"
              description="Learn at your pace, no timer"
              bgColor="bg-violet-100 dark:bg-violet-900/30"
              textColor="text-violet-700 dark:text-violet-400"
              iconBg="bg-violet-200 dark:bg-violet-800/50"
              badge="NEW"
            />
            <FeatureCard
              to="/practice"
              icon={Rocket}
              title="Practice"
              description={cachedCount > 0 ? `${cachedCount.toLocaleString()}+ offline` : 'Quick practice'}
              bgColor="bg-green-100 dark:bg-green-900/30"
              textColor="text-green-700 dark:text-green-400"
              iconBg="bg-green-200 dark:bg-green-800/50"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <FeatureCard
              to="/exam-setup"
              icon={BookOpen}
              title="Full Exam"
              description="JAMB simulation"
              bgColor="bg-pink-100 dark:bg-pink-900/30"
              textColor="text-pink-700 dark:text-pink-400"
              iconBg="bg-pink-200 dark:bg-pink-800/50"
            />
            <FeatureCard
              icon={Bot}
              title="AI Tutor"
              description="Ask anything, get help"
              bgColor="bg-emerald-100 dark:bg-emerald-900/30"
              textColor="text-emerald-700 dark:text-emerald-400"
              iconBg="bg-emerald-200 dark:bg-emerald-800/50"
              onClick={() => setShowAI(true)}
              badge="AI"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
            <Link to="/bookmarks" className="block group">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 h-full transition-all duration-300 group-hover:shadow-lg border border-amber-200 dark:border-amber-800/30">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800/50 rounded-xl flex items-center justify-center">
                    <Bookmark className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-700 dark:text-amber-400 text-xs">Bookmarks</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {bookmarkedQuestions.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            <button onClick={() => setShowDictionary(true)} className="block group text-left">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 h-full transition-all duration-300 group-hover:shadow-lg border border-indigo-200 dark:border-indigo-800/30">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800/50 rounded-xl flex items-center justify-center">
                    <Book className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-700 dark:text-indigo-400 text-xs">Dictionary</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Words</p>
                  </div>
                </div>
              </div>
            </button>
            <button onClick={() => setShowFlashcards(true)} className="block group text-left">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 h-full transition-all duration-300 group-hover:shadow-lg border border-orange-200 dark:border-orange-800/30">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-800/50 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-700 dark:text-orange-400 text-xs">Flashcards</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Study</p>
                  </div>
                </div>
              </div>
            </button>
            <Link to="/analytics" className="block group">
              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-4 h-full transition-all duration-300 group-hover:shadow-lg border border-cyan-200 dark:border-cyan-800/30">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-800/50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">Analytics</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Stats</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {!isOnline && cachedCount > 0 && (
            <motion.div variants={itemVariants} className="bg-amber-900/30 rounded-2xl p-4 border border-amber-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-800/50 flex items-center justify-center">
                  <Download className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-amber-300">Offline Mode Active</p>
                  <p className="text-sm text-amber-400">
                    {cachedCount.toLocaleString()} questions available offline
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {recentExams.length > 0 && (
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                <Link to="/analytics" className="text-emerald-400 text-sm font-medium hover:underline flex items-center gap-1">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentExams.map((exam) => {
                  const modeInfo = getModeInfo(exam.mode)
                  const ModeIcon = modeInfo.icon
                  return (
                    <motion.div 
                      key={exam.id} 
                      whileHover={{ scale: 1.01 }}
                      className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${modeInfo.bg}`}>
                            <ModeIcon className={`w-6 h-6 ${modeInfo.color}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {exam.mode === 'full' ? 'Full Exam' : exam.subjects?.[0] || modeInfo.label}
                            </p>
                            <p className="text-sm text-slate-400">
                              {new Date(exam.date).toLocaleDateString()} • {Math.round(exam.duration / 60)} mins
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            exam.overallScore >= 70 ? 'text-emerald-400' :
                            exam.overallScore >= 50 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {exam.overallScore}%
                          </p>
                          <p className="text-sm text-slate-400">
                            {exam.totalCorrect}/{exam.totalQuestions}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="pt-4">
            <Link to="/profile" className="block">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
                      {userProfile.avatar ? (
                        <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{userProfile.name || 'Set up your profile'}</p>
                      <p className="text-sm text-slate-400">{totalSessions} practice sessions</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
      <Dictionary isOpen={showDictionary} onClose={() => setShowDictionary(false)} />
      <Flashcards isOpen={showFlashcards} onClose={() => setShowFlashcards(false)} />
      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />
    </div>
  )
}
