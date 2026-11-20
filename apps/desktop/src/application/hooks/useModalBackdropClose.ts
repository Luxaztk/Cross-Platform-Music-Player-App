import { useCallback, useRef } from 'react';
import type { HTMLAttributes, PointerEvent as ReactPointerEvent } from 'react';

export interface ModalBackdropCloseOptions {
  disabled?: boolean;
}

export type ModalBackdropProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onPointerDown' | 'onPointerUp' | 'onPointerCancel'
>;

interface PointerOrigin {
  pointerId: number;
  startedOnBackdrop: boolean;
}

export const useModalBackdropClose = (
  onClose: () => void,
  { disabled = false }: ModalBackdropCloseOptions = {}
): ModalBackdropProps => {
  const pointerOriginRef = useRef<PointerOrigin | null>(null);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointerOriginRef.current = {
      pointerId: event.pointerId,
      startedOnBackdrop: event.target === event.currentTarget,
    };
  }, []);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const pointerOrigin = pointerOriginRef.current;
    pointerOriginRef.current = null;

    if (
      !disabled &&
      pointerOrigin?.pointerId === event.pointerId &&
      pointerOrigin.startedOnBackdrop &&
      event.target === event.currentTarget
    ) {
      onClose();
    }
  }, [disabled, onClose]);

  const handlePointerCancel = useCallback(() => {
    pointerOriginRef.current = null;
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };
};
