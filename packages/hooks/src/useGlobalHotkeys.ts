import { useEffect, useCallback } from 'react';
import { usePlayer } from './PlayerProvider';

interface UseGlobalHotkeysProps {
  onToggleFullscreen?: () => void;
  onToggleVisualizer?: () => void;
  onOpenHotkeysModal: () => void;
  onCloseHotkeysModal: () => void;
  isHotkeysModalOpen: boolean;
}

export const useGlobalHotkeys = ({
  onToggleFullscreen,
  onToggleVisualizer,
  onOpenHotkeysModal,
  onCloseHotkeysModal,
  isHotkeysModalOpen,
}: UseGlobalHotkeysProps) => {
  const {
    play,
    pause,
    next,
    prev,
    seek,
    setVolume,
    setRepeatMode,
    toggleShuffle,
    isPlaying,
    progress,
    duration,
    volume,
    repeatMode,
    isShuffle,
  } = usePlayer();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Guard clause: Skip if typing in input fields
      const activeElement = document.activeElement;
      const isInputField =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement)?.contentEditable === 'true';

      if (isInputField && e.key !== 'Escape') {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(progress + 5, duration));
          break;

        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(progress - 5, 0));
          break;

        case 'N':
          if (e.shiftKey) {
            e.preventDefault();
            next();
          }
          break;

        case 'P':
          if (e.shiftKey) {
            e.preventDefault();
            prev();
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(volume + 0.05, 1));
          break;

        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(volume - 0.05, 0));
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          setVolume(volume > 0 ? 0 : 1); // Toggle mute
          break;

        case 'r':
        case 'R':
          e.preventDefault();
          const nextRepeatMode: typeof repeatMode =
            repeatMode === 'OFF' ? 'ALL' : repeatMode === 'ALL' ? 'ONE' : 'OFF';
          setRepeatMode(nextRepeatMode);
          break;

        case 's':
        case 'S':
          e.preventDefault();
          toggleShuffle();
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          console.log('TODO: Toggle Fullscreen');
          onToggleFullscreen?.();
          break;

        case 'v':
        case 'V':
          e.preventDefault();
          console.log('TODO: Toggle Visualizer');
          onToggleVisualizer?.();
          break;

        case 'Escape':
          e.preventDefault();
          if (activeElement && activeElement !== document.body) {
            (activeElement as HTMLElement).blur();
          }
          if (isHotkeysModalOpen) {
            onCloseHotkeysModal();
          }
          break;

        case '/':
          e.preventDefault();
          // Focus search input - assuming there's a search input with id 'search-input'
          const searchInput = document.getElementById('search-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;

        case '?':
          if (e.shiftKey) {
            e.preventDefault();
            onOpenHotkeysModal();
          }
          break;

        default:
          break;
      }
    },
    [
      isPlaying,
      progress,
      duration,
      volume,
      repeatMode,
      isShuffle,
      play,
      pause,
      next,
      prev,
      seek,
      setVolume,
      setRepeatMode,
      toggleShuffle,
      onToggleFullscreen,
      onToggleVisualizer,
      onOpenHotkeysModal,
      onCloseHotkeysModal,
      isHotkeysModalOpen,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};