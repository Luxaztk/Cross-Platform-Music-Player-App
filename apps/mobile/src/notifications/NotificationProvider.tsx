import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { Toast, ToastKind } from './types'
import { useTheme } from '../theme'

type NotifyInput = {
  message: string
  kind?: ToastKind
  durationMs?: number
}

type NotificationContextValue = {
  notify: (input: NotifyInput) => void
  dismiss: (id: string) => void
  clear: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clear = useCallback(() => {
    setToasts([])
  }, [])

  const notify = useCallback(
    (input: NotifyInput) => {
      const toast: Toast = {
        id: makeId(),
        message: input.message,
        kind: input.kind ?? 'info',
        createdAt: Date.now(),
        durationMs: input.durationMs ?? 2200,
      }

      setToasts((prev) => {
        const next = [toast, ...prev].slice(0, 3)
        return next
      })

      setTimeout(() => {
        dismiss(toast.id)
      }, toast.durationMs)
    },
    [dismiss],
  )

  const value = useMemo<NotificationContextValue>(
    () => ({ notify, dismiss, clear }),
    [notify, dismiss, clear],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View pointerEvents="box-none" style={styles.toastHost}>
          {toasts.map((t) => {
            const bg =
              t.kind === 'success'
                ? '#16A34A'
                : t.kind === 'error'
                  ? '#DC2626'
                  : theme.colors.surface

            const textColor = t.kind === 'info' ? theme.colors.text : '#FFFFFF'
            const borderColor = t.kind === 'info' ? theme.colors.border : 'transparent'

            return (
              <View
                key={t.id}
                style={[
                  styles.toast,
                  {
                    backgroundColor: bg,
                    borderColor,
                  },
                ]}
              >
                <Text style={[styles.toastText, { color: textColor }]} numberOfLines={2}>
                  {t.message}
                </Text>
                <Pressable onPress={() => dismiss(t.id)} hitSlop={10}>
                  <Text style={[styles.dismiss, { color: textColor }]}>×</Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      </View>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

const styles = StyleSheet.create({
  toastHost: {
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  toast: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  dismiss: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 18,
  },
})
