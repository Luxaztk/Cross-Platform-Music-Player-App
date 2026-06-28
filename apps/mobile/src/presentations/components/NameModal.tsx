import React, { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

interface NameModalProps {
  visible: boolean
  title: string
  initialValue: string
  placeholder: string
  cancelLabel: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: (value: string) => void
  colors: {
    background: string
    surface: string
    text: string
    mutedText: string
    border: string
    primary: string
  }
}

export function NameModal({
  visible,
  title,
  initialValue,
  placeholder,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  colors,
}: NameModalProps) {
  const [value, setValue] = useState(initialValue)
  const [prevVisible, setPrevVisible] = useState(visible)
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue)

  if (visible !== prevVisible || initialValue !== prevInitialValue) {
    setPrevVisible(visible)
    setPrevInitialValue(initialValue)
    if (visible) {
      setValue(initialValue)
    }
  }

  const trimmed = value.trim()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.modal, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedText}
            autoFocus
            selectTextOnFocus
            maxLength={80}
          />

          <View style={styles.modalBtns}>
            <Pressable onPress={onCancel} style={[styles.modalBtn, { borderColor: colors.border }]}>
              <Text style={[styles.modalBtnText, { color: colors.mutedText }]}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={() => trimmed && onConfirm(trimmed)}
              disabled={!trimmed}
              style={[
                styles.modalBtn,
                { backgroundColor: trimmed ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    borderRadius: 18,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
})
