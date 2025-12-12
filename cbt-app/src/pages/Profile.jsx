import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, User, Camera, Edit2, Check, X, Trophy, Target, Flame,
  BookOpen, TrendingUp, Calendar, Award, LogOut, Star
} from 'lucide-react'
import useStore from '../store/useStore'

export default function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const {
    userProfile,
    isLoggedIn,
    setUserProfile,
    updateProfileAvatar,
    createGuestProfile,
    logout,
    practiceHistory,
    examHistory,
    studyHistory,
  } = useStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(userProfile.name || '')
  const [editEmail, setEditEmail] = useState(userProfile.email || '')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const totalSessions = practiceHistory.length + examHistory.length + studyHistory.length
  const allHistory = [...practiceHistory, ...examHistory, ...studyHistory]
  const averageScore = allHistory.length > 0
    ? Math.round(allHistory.reduce((sum, h) => sum + h.overallScore, 0) / allHistory.length)
    : 0

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      await updateProfileAvatar(file)
    }
  }

  const handleSave = () => {
    setUserProfile({
      name: editName.trim() || 'Student',
      email: editEmail.trim(),
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(userProfile.name || '')
    setEditEmail(userProfile.email || '')
    setIsEditing(false)
  }

  const handleCreateProfile = () => {
    const name = prompt('Enter your name:', 'Student')
    if (name !== null) {
      createGuestProfile(name.trim() || 'Student')
    }
  }

  const handleLogout = () => {
    logout()
    setShowLogoutConfirm(false)
    navigate('/')
  }

  const getAchievementBadges = () => {
    const badges = []
    
    if (totalSessions >= 1) badges.push({ icon: '🎯', name: 'First Steps', desc: 'Complete your first session' })
    if (totalSessions >= 10) badges.push({ icon: '📚', name: 'Dedicated', desc: 'Complete 10 sessions' })
    if (totalSessions >= 50) badges.push({ icon: '🏆', name: 'Master', desc: 'Complete 50 sessions' })
    if (averageScore >= 70) badges.push({ icon: '⭐', name: 'High Achiever', desc: 'Average score above 70%' })
    if (averageScore >= 90) badges.push({ icon: '👑', name: 'Excellence', desc: 'Average score above 90%' })
    if (userProfile.streakDays >= 3) badges.push({ icon: '🔥', name: 'On Fire', desc: '3 day streak' })
    if (userProfile.streakDays >= 7) badges.push({ icon: '💪', name: 'Unstoppable', desc: '7 day streak' })
    
    return badges
  }

  const badges = getAchievementBadges()

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
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
              <h1 className="text-2xl font-bold text-white">Profile</h1>
              <p className="text-slate-400">Your learning journey</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-2xl p-6 border border-emerald-800/50">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <button
                  onClick={handleAvatarClick}
                  className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-4 border-emerald-500/30 hover:border-emerald-500 transition-colors group"
                >
                  {userProfile.avatar ? (
                    <img 
                      src={userProfile.avatar} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {isLoggedIn ? (
                      <>
                        <h2 className="text-2xl font-bold text-white mb-1">{userProfile.name || 'Student'}</h2>
                        {userProfile.email && (
                          <p className="text-slate-400 text-sm mb-2">{userProfile.email}</p>
                        )}
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1 mx-auto sm:mx-0"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Profile
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleCreateProfile}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-semibold"
                      >
                        Create Profile
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-orange-900/50 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-orange-400">{userProfile.streakDays || 0}</p>
              <p className="text-xs text-slate-400">Day Streak</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{totalSessions}</p>
              <p className="text-xs text-slate-400">Sessions</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-green-900/50 flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">{userProfile.totalQuestionsAnswered || 0}</p>
              <p className="text-xs text-slate-400">Questions</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{averageScore}%</p>
              <p className="text-xs text-slate-400">Avg Score</p>
            </div>
          </div>

          {badges.length > 0 && (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Achievements
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((badge, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3 rounded-xl bg-slate-700/50 text-center"
                  >
                    <span className="text-3xl block mb-1">{badge.icon}</span>
                    <p className="font-medium text-white text-sm">{badge.name}</p>
                    <p className="text-xs text-slate-400">{badge.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Activity Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-900/50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white">Practice Sessions</span>
                </div>
                <span className="font-semibold text-emerald-400">{practiceHistory.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-900/50 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-pink-400" />
                  </div>
                  <span className="text-white">Full Exams</span>
                </div>
                <span className="font-semibold text-emerald-400">{examHistory.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-900/50 flex items-center justify-center">
                    <Star className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-white">Study Sessions</span>
                </div>
                <span className="font-semibold text-emerald-400">{studyHistory.length}</span>
              </div>
            </div>
          </div>

          {isLoggedIn && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full p-4 rounded-xl border-2 border-red-800 bg-red-900/20 
                         text-red-300 font-medium hover:bg-red-900/40 
                         transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          )}
        </motion.div>

        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-2">Sign Out?</h3>
              <p className="text-slate-400 mb-6">
                Your progress will be saved locally, but you'll need to create a new profile next time.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
