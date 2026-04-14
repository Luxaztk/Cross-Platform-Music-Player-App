export type ToastKind = 'info' | 'success' | 'error'

export type Toast = {
  id: string
  message: string
  kind: ToastKind
  createdAt: number
  durationMs: number
}
