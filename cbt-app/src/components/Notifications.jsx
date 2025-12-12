import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Check, Trash2, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import useStore from '../store/useStore'

export default function Notifications({ isOpen, onClose }) {
  const { notifications, markNotificationRead, clearNotifications, removeNotification } = useStore()

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 md:bg-transparent"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -10, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-4 top-16 w-80 max-h-[70vh] bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-700/50 transition-colors ${
                      !notification.read ? 'bg-slate-700/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{notification.title}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{notification.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatTime(notification.timestamp)}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => markNotificationRead(notification.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-600 text-slate-400 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-600 text-slate-400 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-700">
              <button
                onClick={clearNotifications}
                className="w-full py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
