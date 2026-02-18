const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || ''

export const telegramApi = {
  async sendMessage(text: string, options: { parse_mode?: 'HTML' | 'Markdown' } = {}): Promise<void> {
    if (!BOT_TOKEN || !CHAT_ID) {
      console.warn('Telegram credentials not configured')
      return
    }
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: options.parse_mode || 'HTML',
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to send Telegram message')
    }
  },

  async sendNotification(title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢'
    const text = `${emoji} <b>${title}</b>\n\n${message}`
    await this.sendMessage(text, { parse_mode: 'HTML' })
  },

  async requestAttention(requester: string, reason: string): Promise<void> {
    const text = `👋 <b>Attention Requested</b>\n\nFrom: ${requester}\nReason: ${reason}\n\n<a href="${window.location.origin}">Open Dashboard</a>`
    await this.sendMessage(text, { parse_mode: 'HTML' })
  }
}
