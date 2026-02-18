import { useState } from 'react'
import { telegramApi } from '../lib/telegram'
import { Bell, Send, AlertTriangle, MessageSquare, CheckCircle } from 'lucide-react'

interface NotificationsProps {
  userRole: 'dan' | 'stephen'
}

export function Notifications({ userRole }: NotificationsProps) {
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  async function handleRequestAttention() {
    if (!message.trim()) return
    
    setRequesting(true)
    try {
      const requester = userRole === 'dan' ? 'Dan Harrison' : 'Stephen Ackroyd'
      await telegramApi.requestAttention(requester, message)
      setMessage('')
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      alert('Could not send notification. Try again.')
    } finally {
      setRequesting(false)
    }
  }

  const otherUser = userRole === 'dan' ? 'Stephen' : 'Dan'

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Send alerts and manage notification settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Request Attention */}
        <div className="editor-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-dork-100 dark:bg-dork-900/30 flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-dork-600 dark:text-dork-400" />
            </div>
            <div>
              <h2 className="font-semibold">Request attention</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Send a message to {otherUser}
              </p>
            </div>
          </div>

          {sent ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 py-4"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Message sent</span>
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`What do you need from ${otherUser}?`}
                rows={4}
                className="editor-input mb-3"
              />

              <button
                onClick={handleRequestAttention}
                disabled={!message.trim() || requesting}
                className="btn-primary w-full"
              >
                <Send className="w-4 h-4" />
                {requesting ? 'Sending...' : 'Send notification'}
              </button>
            </>
          )}
        </div>

        {/* Webhook Status */}
        <div className="editor-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold">Webhook status</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Telegram integration
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bot token</span>
              <span className="text-sm font-medium">
                {import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? '✓ Connected' : '✗ Not set'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Chat ID</span>
              <span className="text-sm font-medium">
                {import.meta.env.VITE_TELEGRAM_CHAT_ID ? '✓ Connected' : '✗ Not set'}
              </span>
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">You will get notified when:</p>
              <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  New stories are added
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Drafts are submitted for review
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Articles publish to WordPress
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Content imports to Barry
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
