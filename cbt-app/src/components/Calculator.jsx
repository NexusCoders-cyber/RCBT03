import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Move } from 'lucide-react'
import useStore from '../store/useStore'

export default function Calculator() {
  const { showCalculator, setShowCalculator } = useStore()
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (showCalculator) {
      const savedPos = localStorage.getItem('calculatorPosition')
      if (savedPos) {
        try {
          setPosition(JSON.parse(savedPos))
        } catch {
          setPosition({ x: 0, y: 0 })
        }
      }
    }
  }, [showCalculator])

  const handleDragStart = (e) => {
    if (e.target.closest('button') && !e.target.closest('[data-drag-handle]')) return
    setIsDragging(true)
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
    startPosRef.current = { x: clientX, y: clientY }
    startOffsetRef.current = { x: position.x, y: position.y }
  }

  const handleDragMove = useCallback((e) => {
    e.preventDefault()
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
    const deltaX = clientX - startPosRef.current.x
    const deltaY = clientY - startPosRef.current.y
    setPosition({
      x: startOffsetRef.current.x + deltaX,
      y: startOffsetRef.current.y + deltaY
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    
    const onMove = (e) => handleDragMove(e)
    const onEnd = () => {
      handleDragEnd()
      const currentPos = { x: startOffsetRef.current.x, y: startOffsetRef.current.y }
      localStorage.setItem('calculatorPosition', JSON.stringify(currentPos))
    }
    
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove, { passive: false })
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem('calculatorPosition', JSON.stringify(position))
    }
  }, [isDragging, position])

  const handleNumber = (num) => {
    if (waitingForNewValue) {
      setDisplay(num)
      setWaitingForNewValue(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.')
      setWaitingForNewValue(false)
    } else if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const handleOperator = (op) => {
    const current = parseFloat(display)
    
    if (previousValue !== null && !waitingForNewValue) {
      const result = calculate(previousValue, current, operation)
      setDisplay(String(result))
      setPreviousValue(result)
    } else {
      setPreviousValue(current)
    }
    
    setOperation(op)
    setWaitingForNewValue(true)
  }

  const calculate = (prev, current, op) => {
    switch (op) {
      case '+':
        return prev + current
      case '-':
        return prev - current
      case '×':
        return prev * current
      case '÷':
        return current !== 0 ? prev / current : 'Error'
      default:
        return current
    }
  }

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display)
      const result = calculate(previousValue, current, operation)
      setDisplay(String(result))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNewValue(false)
  }

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay('0')
    }
  }

  const buttons = [
    { value: 'C', type: 'function', action: handleClear },
    { value: '⌫', type: 'function', action: handleBackspace },
    { value: '÷', type: 'operator', action: () => handleOperator('÷') },
    { value: '×', type: 'operator', action: () => handleOperator('×') },
    { value: '7', type: 'number', action: () => handleNumber('7') },
    { value: '8', type: 'number', action: () => handleNumber('8') },
    { value: '9', type: 'number', action: () => handleNumber('9') },
    { value: '-', type: 'operator', action: () => handleOperator('-') },
    { value: '4', type: 'number', action: () => handleNumber('4') },
    { value: '5', type: 'number', action: () => handleNumber('5') },
    { value: '6', type: 'number', action: () => handleNumber('6') },
    { value: '+', type: 'operator', action: () => handleOperator('+') },
    { value: '1', type: 'number', action: () => handleNumber('1') },
    { value: '2', type: 'number', action: () => handleNumber('2') },
    { value: '3', type: 'number', action: () => handleNumber('3') },
    { value: '=', type: 'equals', action: handleEquals },
    { value: '0', type: 'number', span: true, action: () => handleNumber('0') },
    { value: '.', type: 'number', action: handleDecimal },
  ]

  return (
    <AnimatePresence>
      {showCalculator && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            touchAction: 'none'
          }}
          className="fixed bottom-20 right-4 z-50 w-72 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700"
        >
          <div 
            data-drag-handle="true"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="flex items-center justify-between px-4 py-3 bg-slate-800 cursor-move select-none"
          >
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-slate-500" />
              <span className="text-white font-semibold">Calculator</span>
            </div>
            <button
              onClick={() => setShowCalculator(false)}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 bg-slate-800/50">
            <div className="text-right text-slate-400 text-sm h-5">
              {previousValue !== null && `${previousValue} ${operation || ''}`}
            </div>
            <div className="text-right text-white text-3xl font-light tracking-wider overflow-x-auto">
              {display}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 p-2 bg-slate-900">
            {buttons.map((btn, index) => (
              <button
                key={index}
                onClick={btn.action}
                className={`
                  ${btn.span ? 'col-span-2' : ''}
                  h-14 rounded-xl font-semibold text-lg transition-all duration-150 active:scale-95
                  ${btn.type === 'number' ? 'bg-slate-700 text-white hover:bg-slate-600' : ''}
                  ${btn.type === 'operator' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : ''}
                  ${btn.type === 'function' ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : ''}
                  ${btn.type === 'equals' ? 'bg-emerald-500 text-white hover:bg-emerald-400 row-span-2' : ''}
                `}
              >
                {btn.value}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
