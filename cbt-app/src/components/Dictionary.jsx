import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Volume2, Book, Loader2, AlertCircle } from 'lucide-react'
import { searchDictionary } from '../services/api'

export default function Dictionary({ isOpen, onClose }) {
  const [searchWord, setSearchWord] = useState('')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    if (!searchWord.trim()) return

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const data = await searchDictionary(searchWord.trim())
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const playAudio = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch(() => {})
    }
  }

  const handleClose = () => {
    setSearchWord('')
    setResults(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Book className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Dictionary</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a word..."
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchWord.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/30 border border-red-800">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {results && results.length > 0 && (
              <div className="space-y-4">
                {results.map((entry, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-white">{entry.word}</h3>
                      {entry.phonetics?.find(p => p.audio) && (
                        <button
                          onClick={() => playAudio(entry.phonetics.find(p => p.audio)?.audio)}
                          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-emerald-400 transition-colors"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {entry.phonetic && (
                      <p className="text-slate-400 italic">{entry.phonetic}</p>
                    )}

                    {entry.meanings?.map((meaning, mIdx) => (
                      <div key={mIdx} className="space-y-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-300 text-sm font-medium">
                          {meaning.partOfSpeech}
                        </span>
                        
                        <ol className="space-y-2 ml-4">
                          {meaning.definitions?.slice(0, 3).map((def, dIdx) => (
                            <li key={dIdx} className="text-slate-300">
                              <p>{dIdx + 1}. {def.definition}</p>
                              {def.example && (
                                <p className="text-sm text-slate-400 italic mt-1">
                                  Example: "{def.example}"
                                </p>
                              )}
                            </li>
                          ))}
                        </ol>

                        {meaning.synonyms?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-sm text-slate-400">Synonyms:</span>
                            {meaning.synonyms.slice(0, 5).map((syn, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => setSearchWord(syn)}
                                className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
                              >
                                {syn}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && !results && (
              <div className="text-center py-8">
                <Book className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Enter a word to search its meaning</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
