import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import useStore from '../store/useStore'

export default function SubjectSelect() {
  const navigate = useNavigate()
  const { subjects } = useStore()

  const handleSubjectClick = (subject) => {
    navigate(`/practice-setup?subject=${subject.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Practice Mode</h1>
              <p className="text-slate-400">Select a subject to practice</p>
            </div>
          </div>

          <div className="grid gap-3">
            {subjects.map((subject, index) => (
              <motion.button
                key={subject.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSubjectClick(subject)}
                className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-700/50 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${subject.color}20` }}
                  >
                    {subject.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {subject.isCalculation ? 'Calculation-based' : 'Theory-based'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
