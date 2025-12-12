import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const JAMB_SUBJECTS = [
  { id: 'english', name: 'English Language', icon: '📝', color: '#9CA3AF', bgColor: 'bg-gray-200', isCalculation: false },
  { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#A855F7', bgColor: 'bg-purple-200', isCalculation: true },
  { id: 'physics', name: 'Physics', icon: '⚡', color: '#EAB308', bgColor: 'bg-yellow-200', isCalculation: true },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#22C55E', bgColor: 'bg-green-200', isCalculation: true },
  { id: 'biology', name: 'Biology', icon: '🧬', color: '#EC4899', bgColor: 'bg-pink-200', isCalculation: false },
  { id: 'literature', name: 'Literature in English', icon: '📖', color: '#F97316', bgColor: 'bg-orange-200', isCalculation: false },
  { id: 'government', name: 'Government', icon: '🏛️', color: '#EF4444', bgColor: 'bg-red-200', isCalculation: false },
  { id: 'commerce', name: 'Commerce', icon: '💼', color: '#14B8A6', bgColor: 'bg-teal-200', isCalculation: false },
  { id: 'accounting', name: 'Accounting', icon: '📊', color: '#6366F1', bgColor: 'bg-indigo-200', isCalculation: true },
  { id: 'economics', name: 'Economics', icon: '📈', color: '#06B6D4', bgColor: 'bg-cyan-200', isCalculation: true },
  { id: 'crk', name: 'Christian Religious Studies', icon: '✝️', color: '#F59E0B', bgColor: 'bg-amber-200', isCalculation: false },
  { id: 'irk', name: 'Islamic Religious Studies', icon: '☪️', color: '#10B981', bgColor: 'bg-emerald-200', isCalculation: false },
  { id: 'geography', name: 'Geography', icon: '🌍', color: '#84CC16', bgColor: 'bg-lime-200', isCalculation: false },
  { id: 'agric', name: 'Agricultural Science', icon: '🌾', color: '#22C55E', bgColor: 'bg-green-200', isCalculation: false },
  { id: 'history', name: 'History', icon: '📜', color: '#A16207', bgColor: 'bg-amber-200', isCalculation: false },
]

const YEARS = Array.from({ length: 48 }, (_, i) => 2025 - i)

const DEFAULT_PROFILE = {
  id: null,
  name: '',
  email: '',
  avatar: null,
  avatarType: null,
  createdAt: null,
  lastLogin: null,
  streakDays: 0,
  lastPracticeDate: null,
  totalQuestionsAnswered: 0,
  totalCorrectAnswers: 0,
  achievements: [],
  preferredSubjects: [],
}

const useStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      fontSize: 'medium',
      timerEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      calculatorEnabled: true,
      
      subjects: JAMB_SUBJECTS,
      years: YEARS,
      
      userProfile: { ...DEFAULT_PROFILE },
      isLoggedIn: false,
      
      currentExam: null,
      examMode: null,
      selectedSubjects: [],
      questions: [],
      currentQuestionIndex: 0,
      currentSubjectIndex: 0,
      answers: {},
      markedForReview: [],
      bookmarkedQuestions: [],
      timeRemaining: 0,
      examStartTime: null,
      examEndTime: null,
      isExamActive: false,
      isExamSubmitted: false,
      showCalculator: false,
      
      studyMode: {
        isActive: false,
        selectedSubjects: [],
        selectedYears: [],
        showAnswer: false,
        currentAnswerRevealed: false,
        questionsPerSubject: 20,
      },
      
      practiceHistory: [],
      examHistory: [],
      studyHistory: [],
      notifications: [],
      isOnline: true,
      
      showResultsModal: false,
      pendingResult: null,
      
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setTimerEnabled: (timerEnabled) => set({ timerEnabled }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setVibrationEnabled: (vibrationEnabled) => set({ vibrationEnabled }),
      setCalculatorEnabled: (calculatorEnabled) => set({ calculatorEnabled }),
      toggleCalculator: () => set((state) => ({ showCalculator: !state.showCalculator })),
      setShowCalculator: (show) => set({ showCalculator: show }),
      
      setUserProfile: (profile) => {
        const updatedProfile = {
          ...get().userProfile,
          ...profile,
          lastLogin: Date.now(),
        }
        set({ 
          userProfile: updatedProfile,
          isLoggedIn: true,
        })
      },
      
      updateProfileAvatar: async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const avatarData = reader.result
            set((state) => ({
              userProfile: {
                ...state.userProfile,
                avatar: avatarData,
                avatarType: file.type,
              },
            }))
            resolve(avatarData)
          }
          reader.readAsDataURL(file)
        })
      },
      
      updateProfileStats: (correct, total) => {
        set((state) => {
          const today = new Date().toDateString()
          const lastPractice = state.userProfile.lastPracticeDate
          let newStreak = state.userProfile.streakDays
          
          if (lastPractice) {
            const lastDate = new Date(lastPractice).toDateString()
            const yesterday = new Date(Date.now() - 86400000).toDateString()
            
            if (lastDate === yesterday) {
              newStreak += 1
            } else if (lastDate !== today) {
              newStreak = 1
            }
          } else {
            newStreak = 1
          }
          
          return {
            userProfile: {
              ...state.userProfile,
              totalQuestionsAnswered: state.userProfile.totalQuestionsAnswered + total,
              totalCorrectAnswers: state.userProfile.totalCorrectAnswers + correct,
              streakDays: newStreak,
              lastPracticeDate: today,
            },
          }
        })
      },
      
      logout: () => {
        set({
          userProfile: { ...DEFAULT_PROFILE },
          isLoggedIn: false,
        })
      },
      
      createGuestProfile: (name) => {
        const profile = {
          ...DEFAULT_PROFILE,
          id: `guest_${Date.now()}`,
          name: name || 'Student',
          createdAt: Date.now(),
          lastLogin: Date.now(),
        }
        set({
          userProfile: profile,
          isLoggedIn: true,
        })
      },
      
      bookmarkQuestion: (question) => {
        set((state) => {
          const exists = state.bookmarkedQuestions.some(q => q.id === question.id)
          if (exists) {
            return {
              bookmarkedQuestions: state.bookmarkedQuestions.filter(q => q.id !== question.id)
            }
          }
          return {
            bookmarkedQuestions: [...state.bookmarkedQuestions, {
              ...question,
              bookmarkedAt: Date.now()
            }]
          }
        })
      },
      
      removeBookmark: (questionId) => {
        set((state) => ({
          bookmarkedQuestions: state.bookmarkedQuestions.filter(q => q.id !== questionId)
        }))
      },
      
      isBookmarked: (questionId) => {
        return get().bookmarkedQuestions.some(q => q.id === questionId)
      },
      
      initStudyMode: (subjects, years, questionsPerSubject = 20) => {
        set({
          studyMode: {
            isActive: false,
            selectedSubjects: subjects,
            selectedYears: years,
            showAnswer: true,
            currentAnswerRevealed: false,
            questionsPerSubject,
          },
        })
      },
      
      startStudyMode: (subjects, questions) => {
        const allQuestions = []
        let globalIndex = 0
        
        subjects.forEach((subject, subjectIdx) => {
          const subjectQuestions = questions[subject.id] || []
          subjectQuestions.forEach((q, qIdx) => {
            allQuestions.push({
              ...q,
              id: q.id || `${subject.id}-study-${qIdx}`,
              globalIndex: globalIndex++,
              subjectId: subject.id,
              subjectIndex: subjectIdx,
            })
          })
        })
        
        set({
          examMode: 'study',
          selectedSubjects: subjects,
          questions: allQuestions,
          currentQuestionIndex: 0,
          currentSubjectIndex: 0,
          answers: {},
          markedForReview: [],
          timeRemaining: 0,
          examStartTime: Date.now(),
          isExamActive: true,
          isExamSubmitted: false,
          showCalculator: false,
          studyMode: {
            ...get().studyMode,
            isActive: true,
            currentAnswerRevealed: false,
          },
        })
      },
      
      revealAnswer: () => {
        set((state) => ({
          studyMode: {
            ...state.studyMode,
            currentAnswerRevealed: true,
          },
        }))
      },
      
      hideAnswer: () => {
        set((state) => ({
          studyMode: {
            ...state.studyMode,
            currentAnswerRevealed: false,
          },
        }))
      },
      
      startPracticeMode: (subject, year, questions, duration) => {
        set({
          examMode: 'practice',
          selectedSubjects: [subject],
          questions: questions.map((q, i) => ({ 
            ...q, 
            id: q.id || `${subject.id}-${year || 'all'}-${q.examtype || 'utme'}-${i}`,
            globalIndex: i, 
            subjectId: subject.id 
          })),
          currentQuestionIndex: 0,
          currentSubjectIndex: 0,
          answers: {},
          markedForReview: [],
          timeRemaining: duration * 60,
          examStartTime: Date.now(),
          isExamActive: true,
          isExamSubmitted: false,
          showCalculator: false,
        })
      },
      
      startFullExamMode: (subjects, questionsMap, duration) => {
        const allQuestions = []
        let globalIndex = 0
        
        subjects.forEach((subject, subjectIdx) => {
          const subjectQuestions = questionsMap[subject.id] || []
          subjectQuestions.forEach((q, qIdx) => {
            allQuestions.push({
              ...q,
              id: q.id || `${subject.id}-exam-${q.examtype || 'utme'}-${qIdx}`,
              globalIndex: globalIndex++,
              subjectId: subject.id,
              subjectIndex: subjectIdx,
            })
          })
        })
        
        set({
          examMode: 'full',
          selectedSubjects: subjects,
          questions: allQuestions,
          currentQuestionIndex: 0,
          currentSubjectIndex: 0,
          answers: {},
          markedForReview: [],
          timeRemaining: duration * 60,
          examStartTime: Date.now(),
          isExamActive: true,
          isExamSubmitted: false,
          showCalculator: false,
        })
      },
      
      setCurrentQuestion: (index) => {
        const questions = get().questions
        if (index >= 0 && index < questions.length) {
          const question = questions[index]
          set({
            currentQuestionIndex: index,
            currentSubjectIndex: question.subjectIndex || 0,
            studyMode: {
              ...get().studyMode,
              currentAnswerRevealed: false,
            },
          })
        }
      },
      
      setCurrentSubject: (subjectIndex) => {
        const questions = get().questions
        const selectedSubjects = get().selectedSubjects
        
        if (subjectIndex >= 0 && subjectIndex < selectedSubjects.length) {
          const subject = selectedSubjects[subjectIndex]
          const firstQuestionOfSubject = questions.findIndex(q => q.subjectId === subject.id)
          
          if (firstQuestionOfSubject !== -1) {
            set({
              currentSubjectIndex: subjectIndex,
              currentQuestionIndex: firstQuestionOfSubject,
              studyMode: {
                ...get().studyMode,
                currentAnswerRevealed: false,
              },
            })
          }
        }
      },
      
      answerQuestion: (questionIndex, answer) => {
        set((state) => ({
          answers: { ...state.answers, [questionIndex]: answer },
        }))
      },
      
      toggleMarkForReview: (questionIndex) => {
        set((state) => {
          const marked = state.markedForReview.includes(questionIndex)
          return {
            markedForReview: marked
              ? state.markedForReview.filter((i) => i !== questionIndex)
              : [...state.markedForReview, questionIndex],
          }
        })
      },
      
      updateTimeRemaining: (time) => set({ timeRemaining: time }),
      
      submitExam: () => {
        const state = get()
        const result = calculateResult(state)
        
        const examRecord = {
          id: Date.now(),
          mode: state.examMode,
          subjects: state.selectedSubjects.map(s => s.name),
          subjectIds: state.selectedSubjects.map(s => s.id),
          date: new Date().toISOString(),
          duration: Math.floor((Date.now() - state.examStartTime) / 1000),
          questions: state.questions,
          answers: state.answers,
          ...result,
        }
        
        get().updateProfileStats(result.totalCorrect, result.totalQuestions)
        
        const historyKey = state.examMode === 'study' ? 'studyHistory' : 
                          state.examMode === 'practice' ? 'practiceHistory' : 'examHistory'
        
        set((state) => ({
          isExamActive: false,
          isExamSubmitted: true,
          examEndTime: Date.now(),
          currentExam: examRecord,
          showCalculator: false,
          showResultsModal: true,
          pendingResult: examRecord,
          studyMode: {
            ...state.studyMode,
            isActive: false,
            currentAnswerRevealed: false,
          },
          [historyKey]: [
            examRecord,
            ...(state[historyKey] || []).slice(0, 49),
          ],
        }))
        
        return examRecord
      },
      
      closeResultsModal: () => {
        set({
          showResultsModal: false,
          pendingResult: null,
        })
      },
      
      resetExam: () => {
        set({
          currentExam: null,
          examMode: null,
          selectedSubjects: [],
          questions: [],
          currentQuestionIndex: 0,
          currentSubjectIndex: 0,
          answers: {},
          markedForReview: [],
          timeRemaining: 0,
          examStartTime: null,
          examEndTime: null,
          isExamActive: false,
          isExamSubmitted: false,
          showCalculator: false,
          showResultsModal: false,
          pendingResult: null,
          studyMode: {
            isActive: false,
            selectedSubjects: [],
            selectedYears: [],
            showAnswer: true,
            currentAnswerRevealed: false,
            questionsPerSubject: 20,
          },
        })
      },
      
      clearAllData: () => {
        set({
          practiceHistory: [],
          examHistory: [],
          studyHistory: [],
          bookmarkedQuestions: [],
          notifications: [],
          currentExam: null,
          examMode: null,
          selectedSubjects: [],
          questions: [],
          currentQuestionIndex: 0,
          currentSubjectIndex: 0,
          answers: {},
          markedForReview: [],
          timeRemaining: 0,
          examStartTime: null,
          examEndTime: null,
          isExamActive: false,
          isExamSubmitted: false,
          showCalculator: false,
          showResultsModal: false,
          pendingResult: null,
          studyMode: {
            isActive: false,
            selectedSubjects: [],
            selectedYears: [],
            showAnswer: true,
            currentAnswerRevealed: false,
            questionsPerSubject: 20,
          },
        })
      },
      
      setOnlineStatus: (isOnline) => set({ isOnline }),
      
      addNotification: (notification) => {
        set((state) => ({
          notifications: [
            {
              id: Date.now(),
              timestamp: Date.now(),
              read: false,
              ...notification,
            },
            ...state.notifications.slice(0, 49),
          ],
        }))
      },
      
      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },
      
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'jamb-cbt-storage',
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        timerEnabled: state.timerEnabled,
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
        calculatorEnabled: state.calculatorEnabled,
        practiceHistory: state.practiceHistory,
        examHistory: state.examHistory,
        studyHistory: state.studyHistory,
        bookmarkedQuestions: state.bookmarkedQuestions,
        notifications: state.notifications,
        userProfile: state.userProfile,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)

function calculateResult(state) {
  const { questions, answers, selectedSubjects } = state
  
  let totalCorrect = 0
  let totalWrong = 0
  let totalUnanswered = 0
  
  const subjectResults = {}
  const questionDetails = []
  
  selectedSubjects.forEach((subject) => {
    subjectResults[subject.id] = {
      name: subject.name,
      icon: subject.icon,
      total: 0,
      correct: 0,
      wrong: 0,
      unanswered: 0,
      score: 0,
    }
  })
  
  questions.forEach((question, index) => {
    const userAnswer = answers[index]
    const subjectId = question.subjectId
    
    subjectResults[subjectId].total++
    
    let status = 'unanswered'
    if (userAnswer === undefined || userAnswer === null) {
      totalUnanswered++
      subjectResults[subjectId].unanswered++
    } else if (userAnswer === question.answer) {
      totalCorrect++
      subjectResults[subjectId].correct++
      status = 'correct'
    } else {
      totalWrong++
      subjectResults[subjectId].wrong++
      status = 'wrong'
    }
    
    questionDetails.push({
      ...question,
      userAnswer,
      status,
      index,
    })
  })
  
  Object.keys(subjectResults).forEach((subjectId) => {
    const result = subjectResults[subjectId]
    result.score = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0
  })
  
  const totalQuestions = questions.length
  const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  
  return {
    totalQuestions,
    totalCorrect,
    totalWrong,
    totalUnanswered,
    overallScore,
    subjectResults,
    questionDetails,
  }
}

export default useStore
