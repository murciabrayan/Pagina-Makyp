import type { WhatsAppMessageParams } from '@/types'

export function buildWhatsAppUrl({ phone, message }: WhatsAppMessageParams): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
