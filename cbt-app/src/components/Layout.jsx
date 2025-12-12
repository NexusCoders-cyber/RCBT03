import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, BookOpen, Settings, Menu, X, Bell, GraduationCap, Book, WifiOff, Bot, User, Star, Brain, Layers } from 'lucide-react'
import useStore from '../store/useStore'
import Notifications from './Notifications'
import Dictionary from './Dictionary'
import AIAssistant from './AIAssistant'
import ResultsModal from './ResultsModal'
import Flashcards from './Flashcards'

export default function Layout() {
  const location = useLocation()
  const { isExamActive, notifications, isOnline, setOnlineStatus, addNotification, userProfile, showResultsModal } = useStore()
  const [showSidebar, setShowSidebar] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showDictionary, setShowDictionary] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showFlashcards, setShowFlashcards] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true)
      addNotification({
        type: 'success',
        title: 'Back Online',
        message: 'Your internet connection has been restored.',
      })
    }

    const handleOffline = () => {
      setOnlineStatus(false)
      addNotification({
        type: 'warning',
        title: 'You are Offline',
        message: 'Some features may be limited. Cached questions are still available.',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setOnlineStatus(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus, addNotification])

  const isExamPage = location.pathname === '/exam' || location.pathname === '/study'

  if (isExamPage && isExamActive) {
    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen"
      >
        <Outlet />
        {showResultsModal && <ResultsModal />}
      </motion.main>
    )
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/study-setup', icon: Star, label: 'Study' },
    { path: '/practice', icon: BookOpen, label: 'Practice' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  const sidebarItems = [
    ...navItems,
    { path: '/novel', icon: Layers, label: 'Literature Novel' },
    { action: () => { setShowSidebar(false); setShowFlashcards(true) }, icon: Brain, label: 'Flashcards', isButton: true },
    { action: () => { setShowSidebar(false); setShowAI(true) }, icon: Bot, label: 'AI Assistant', isButton: true, highlight: true },
    { action: () => { setShowSidebar(false); setShowDictionary(true) }, icon: Book, label: 'Dictionary', isButton: true },
  ]

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-900 sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSidebar(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors md:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-white">JAMB CBT</h1>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2
                      ${isActive 
                        ? 'bg-emerald-900/50 text-emerald-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={() => setShowFlashcards(true)}
                className="px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 text-amber-400 hover:bg-amber-900/30"
              >
                <Brain className="w-4 h-4" />
                Flashcards
              </button>
            </nav>

            <div className="flex items-center gap-2">
              {!isOnline && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-900/50 text-amber-400 text-sm">
                  <WifiOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Offline</span>
                </div>
              )}
              <button 
                onClick={() => setShowAI(true)}
                className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
                title="AI Study Assistant"
              >
                <Bot className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowDictionary(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
                title="Dictionary"
              >
                <Book className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowNotifications(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-medium flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <Link
                to="/profile"
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors overflow-hidden"
              >
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showSidebar && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">JAMB CBT</span>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <Link
                  to="/profile"
                  onClick={() => setShowSidebar(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 mb-4"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                    {userProfile.avatar ? (
                      <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{userProfile.name || 'Student'}</p>
                    <p className="text-sm text-slate-400">View Profile</p>
                  </div>
                </Link>
              </div>
              
              <nav className="px-4 space-y-1">
                {sidebarItems.map((item, idx) => {
                  if (item.isButton) {
                    return (
                      <button
                        key={idx}
                        onClick={item.action}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 w-full text-left
                          ${item.highlight 
                            ? 'text-emerald-400 hover:bg-emerald-900/50' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    )
                  }
                  
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowSidebar(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-emerald-900/50 text-emerald-400' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
                <div className="text-center text-slate-500 text-xs">
                  JAMB CBT Practice App
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'text-emerald-400' 
                    : 'text-slate-500'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowFlashcards(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 text-amber-400"
          >
            <Brain className="w-5 h-5" />
            <span className="text-xs font-medium">Cards</span>
          </button>
        </div>
      </nav>

      <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <Dictionary isOpen={showDictionary} onClose={() => setShowDictionary(false)} />
      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />
      <Flashcards isOpen={showFlashcards} onClose={() => setShowFlashcards(false)} />
      {showResultsModal && <ResultsModal />}
    </div>
  )
}
