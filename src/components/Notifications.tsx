import { useState } from 'react'
import { telegramApi } from '../lib/telegram'
import { Bell, Send, AlertTriangle } from 'lucide-react'

interface NotificationsProps {
  userRole: 'dan' | 'stephen'
}

export function Notifications({ userRole }: NotificationsProps) {
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleRequestAttention() {
    if (!message.trim()) return
    
    setRequesting(true)
    try {
      const requester = userRole === 'dan' ? 'Dan Harrison' : 'Stephen Ackroyd'
      await telegramApi.requestAttention(requester, message)
      setMessage('')
      alert('Notification sent!')
    } catch (err) {
      alert('Failed to send notification')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Request Attention */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-dork-100 dark:bg-dork-900">
              <Bell className="h-5 w-5 text-dork-600 dark:text-dork-400" />
            </div>
            <div>
              <h2 className="font-semibold">Request Attention</h2>
              <p className="text-sm text-muted-foreground">
                Send a notification to {userRole === 'dan' ? 'Stephen' : 'Dan'}
              </p>
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Let ${userRole === 'dan' ? 'Stephen' : 'Dan'} know what you need...`}
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-input bg-background mb-4"
          />

          <button
            onClick={handleRequestAttention}
            disabled={!message.trim() || requesting}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-dork-600 text-white hover:bg-dork-700 disabled:opacity-50 w-full justify-center"
          >
            <Send className="h-4 w-4" />
            {requesting ? 'Sending...' : 'Send Notification'}
          </button>
        </div>

        {/* Webhook Info */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="font-semibold">Webhook Setup</h2>
              <p className="text-sm text-muted-foreground">Configure Telegram notifications</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Bot Token:</p>
              <p className="font-mono text-xs bg-muted p-2 rounded">
                {import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? '✓ Configured' : '✗ Not configured'}
              </p>
            </div>
            
            <div>
              <p className="text-muted-foreground">Chat ID:</p>
              <p className="font-mono text-xs bg-muted p-2 rounded">
                {import.meta.env.VITE_TELEGRAM_CHAT_ID ? '✓ Configured' : '✗ Not configured'}
              </p>
            </div>

            <div className="pt-2">
              <p className="text-muted-foreground">Notifications are sent when:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li>New feed items are added</li>
                <li>Drafts are submitted for review</li>
                <li>Articles are published to WordPress</li>
                <li>Articles are imported to Barry</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
