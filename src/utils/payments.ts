export type PaymentsMode = 'sandbox' | 'production'

export function getPaymentsMode(): PaymentsMode {
  const mode = process.env.PAYMENTS_MODE ?? process.env.NEXT_PUBLIC_PAYMENTS_MODE ?? 'sandbox'
  return mode === 'production' ? 'production' : 'sandbox'
}

export function createSandboxPaymentReference(idCita: string) {
  const shortId = idCita.replace(/-/g, '').slice(0, 10).toUpperCase()
  return `SBX-${Date.now()}-${shortId}`
}
