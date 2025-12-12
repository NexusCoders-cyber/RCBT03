import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Pause, Play, Square } from 'lucide-react'
import { 
  isVoiceAvailable, 
  readQuestion, 
  stopReading, 
  pauseReading, 
  resumeReading,
  getIsReading 
} from '../services/voiceService'

export default function VoiceReader({ question, className = '' }) {
  const [isReading, setIsReading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    setIsAvailable(isVoiceAvailable())
  }, [])

  useEffect(() => {
    return () => {
      stopReading()
    }
  }, [question])

  useEffect(() => {
    stopReading()
    setIsReading(false)
    setIsPaused(false)
  }, [question?.id])

  const handleRead = async () => {
    if (!question || !isAvailable) return

    if (isReading && !isPaused) {
      pauseReading()
      setIsPaused(true)
      return
    }

    if (isPaused) {
      resumeReading()
      setIsPaused(false)
      return
    }

    setIsReading(true)
    setIsPaused(false)

    try {
      await readQuestion(question, {
        rate: 0.9,
        onEnd: () => {
          setIsReading(false)
          setIsPaused(false)
        },
        onError: () => {
          setIsReading(false)
          setIsPaused(false)
        }
      })
    } catch (error) {
      setIsReading(false)
      setIsPaused(false)
    }
  }

  const handleStop = () => {
    stopReading()
    setIsReading(false)
    setIsPaused(false)
  }

  if (!isAvailable) return null

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={handleRead}
        className={`p-2 rounded-lg transition-colors ${
          isReading 
            ? isPaused
              ? 'bg-amber-900/50 text-amber-400'
              : 'bg-emerald-900/50 text-emerald-400'
            : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
        }`}
        title={isReading ? (isPaused ? 'Resume' : 'Pause') : 'Read aloud'}
      >
        {isReading ? (
          isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
      
      {isReading && (
        <button
          onClick={handleStop}
          className="p-2 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-900/70 transition-colors"
          title="Stop reading"
        >
          <Square className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export function VoiceReaderCompact({ question, className = '' }) {
  const [isReading, setIsReading] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    setIsAvailable(isVoiceAvailable())
  }, [])

  useEffect(() => {
    return () => {
      stopReading()
    }
  }, [question])

  useEffect(() => {
    stopReading()
    setIsReading(false)
  }, [question?.id])

  const handleToggle = async () => {
    if (!question || !isAvailable) return

    if (isReading) {
      stopReading()
      setIsReading(false)
      return
    }

    setIsReading(true)

    try {
      await readQuestion(question, {
        rate: 0.9,
        onEnd: () => setIsReading(false),
        onError: () => setIsReading(false)
      })
    } catch {
      setIsReading(false)
    }
  }

  if (!isAvailable) return null

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg transition-colors ${
        isReading 
          ? 'bg-emerald-900/50 text-emerald-400'
          : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
      } ${className}`}
      title={isReading ? 'Stop reading' : 'Read question aloud'}
    >
      {isReading ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  )
}
