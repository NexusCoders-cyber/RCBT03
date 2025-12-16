import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useStore from './store/useStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SubjectSelect from './pages/SubjectSelect'
import PracticeSetup from './pages/PracticeSetup'
import ExamSetup from './pages/ExamSetup'
import Exam from './pages/Exam'
import Results from './pages/Results'
import Review from './pages/Review'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Bookmarks from './pages/Bookmarks'
import StudySetup from './pages/StudySetup'
import Study from './pages/Study'
import Profile from './pages/Profile'
import NovelPage from './pages/NovelPage'
import { prefetchAllQuestionsForOffline } from './services/offlineStorage'

function App() {
  const { theme, fontSize, createGuestProfile, isLoggedIn, setOnlineStatus, addNotification } = useStore()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg')
    switch (fontSize) {
      case 'small':
        document.documentElement.classList.add('text-sm')
        break
      case 'large':
        document.documentElement.classList.add('text-lg')
        break
      default:
        document.documentElement.classList.add('text-base')
    }
  }, [fontSize])

  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnlineStatus(navigator.onLine)
    }
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    updateOnlineStatus()
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [setOnlineStatus])

  useEffect(() => {
    if (!isLoggedIn) {
      createGuestProfile('Student')
    }
  }, [isLoggedIn, createGuestProfile])

  useEffect(() => {
    const fetchQuestionsForOffline = async () => {
      if (!navigator.onLine) return
      
      try {
        const results = await prefetchAllQuestionsForOffline()
        if (results.success.length > 0) {
          addNotification({
            type: 'success',
            title: 'Offline Ready',
            message: `${results.success.length} subjects cached for offline use`
          })
        }
      } catch {
      }
    }
    
    const timeoutId = setTimeout(fetchQuestionsForOffline, 2000)
    return () => clearTimeout(timeoutId)
  }, [addNotification])

  return (
    <div className="min-h-screen bg-slate-900 transition-colors duration-300">
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="practice" element={<SubjectSelect />} />
            <Route path="practice-setup" element={<PracticeSetup />} />
            <Route path="exam-setup" element={<ExamSetup />} />
            <Route path="exam" element={<Exam />} />
            <Route path="results" element={<Results />} />
            <Route path="review" element={<Review />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="study-setup" element={<StudySetup />} />
            <Route path="study" element={<Study />} />
            <Route path="profile" element={<Profile />} />
            <Route path="novel" element={<NovelPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
