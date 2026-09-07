import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalHotkeys } from '../../../application/hooks/useGlobalHotkeys';
import { usePlayer } from '@music/hooks';
import { useHotkeysModal } from '../../../application/context/HotkeysContext';
import type { HotkeysContextType } from '../../../application/context/HotkeysContext';
import type { PlayerContextProps } from '@music/hooks';

vi.mock('@music/hooks', () => ({
  usePlayer: vi.fn(),
}));

vi.mock('../../../application/context/HotkeysContext', () => ({
  useHotkeysModal: vi.fn(),
}));

describe('useGlobalHotkeys', () => {
  let mockPlayer: PlayerContextProps;
  let mockHotkeysModal: HotkeysContextType;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPlayer = {
      ...({} as unknown as PlayerContextProps),
      play: vi.fn(),
      pause: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
      seek: vi.fn(),
      setVolume: vi.fn(),
      setRepeatMode: vi.fn(),
      toggleShuffle: vi.fn(),
      isPlaying: false,
      progress: 50,
      duration: 200,
      volume: 0.5,
      repeatMode: 'OFF',
    };

    mockHotkeysModal = {
      ...({} as unknown as HotkeysContextType),
      isHotkeysModalOpen: false,
      openHotkeysModal: vi.fn(),
      closeHotkeysModal: vi.fn(),
    };

    vi.mocked(usePlayer).mockReturnValue(mockPlayer);
    vi.mocked(useHotkeysModal).mockReturnValue(mockHotkeysModal);
  });

  const fireKey = (key: string, options: Partial<KeyboardEventInit> = {}) => {
    const event = new KeyboardEvent('keydown', { key, ...options });
    window.dispatchEvent(event);
  };

  it('should toggle play/pause on Space', () => {
    renderHook(() => useGlobalHotkeys());
    
    // Test play
    fireKey(' ');
    expect(mockPlayer.play).toHaveBeenCalled();

    // Test pause
    mockPlayer.isPlaying = true;
    vi.mocked(usePlayer).mockReturnValue({ ...mockPlayer, isPlaying: true });
    
    // Need to re-render to pick up new state
    const { unmount } = renderHook(() => useGlobalHotkeys());
    fireKey(' ');
    expect(mockPlayer.pause).toHaveBeenCalled();
    unmount();
  });

  it('should skip shortcuts when focus is in an input field', () => {
    renderHook(() => useGlobalHotkeys());
    
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    input.focus();

    fireKey(' ');
    expect(mockPlayer.play).not.toHaveBeenCalled();

    input.blur();
    document.body.removeChild(input);
  });

  it('should not skip shortcuts if focus is in a range input', () => {
    renderHook(() => useGlobalHotkeys());
    
    const range = document.createElement('input');
    range.type = 'range';
    document.body.appendChild(range);
    range.focus();

    fireKey(' ');
    expect(mockPlayer.play).toHaveBeenCalled();

    fireKey('ArrowRight');
    expect(mockPlayer.seek).toHaveBeenCalledWith(55);

    fireKey('ArrowLeft');
    expect(mockPlayer.seek).toHaveBeenCalledWith(45);

    fireKey('ArrowUp');
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.55);

    fireKey('ArrowDown');
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.45);

    range.blur();
    document.body.removeChild(range);
  });

  it('should seek forward on ArrowRight', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('ArrowRight');
    expect(mockPlayer.seek).toHaveBeenCalledWith(55); // progress + 5
  });

  it('should seek backward on ArrowLeft', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('ArrowLeft');
    expect(mockPlayer.seek).toHaveBeenCalledWith(45); // progress - 5
  });

  it('should play next on Shift+N', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('N', { shiftKey: true });
    expect(mockPlayer.next).toHaveBeenCalled();
  });

  it('should play prev on Shift+P', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('P', { shiftKey: true });
    expect(mockPlayer.prev).toHaveBeenCalled();
  });

  it('should increase volume on ArrowUp', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('ArrowUp');
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.55); // volume + 0.05
  });

  it('should decrease volume on ArrowDown', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('ArrowDown');
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.45); // volume - 0.05
  });

  it('should toggle mute on M', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('m');
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0);
    
    mockPlayer.volume = 0;
    vi.mocked(usePlayer).mockReturnValue({ ...mockPlayer, volume: 0 });
    
    const { unmount } = renderHook(() => useGlobalHotkeys());
    fireKey('m');
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(1);
    unmount();
  });

  it('should toggle repeat mode on R', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('r');
    expect(mockPlayer.setRepeatMode).toHaveBeenCalledWith('ALL');
  });

  it('should toggle shuffle on S', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('s');
    expect(mockPlayer.toggleShuffle).toHaveBeenCalled();
  });

  it('should toggle fullscreen on F', () => {
    const onToggleFullscreen = vi.fn();
    renderHook(() => useGlobalHotkeys({ onToggleFullscreen }));
    fireKey('f');
    expect(onToggleFullscreen).toHaveBeenCalled();
  });

  it('should toggle visualizer on V', () => {
    const onToggleVisualizer = vi.fn();
    renderHook(() => useGlobalHotkeys({ onToggleVisualizer }));
    fireKey('v');
    expect(onToggleVisualizer).toHaveBeenCalled();
  });

  it('should handle Escape key to close modal and blur input', () => {
    renderHook(() => useGlobalHotkeys());
    
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    // Simulate modal open
    mockHotkeysModal.isHotkeysModalOpen = true;
    vi.mocked(useHotkeysModal).mockReturnValue({ ...mockHotkeysModal, isHotkeysModalOpen: true });
    
    const { unmount } = renderHook(() => useGlobalHotkeys());
    
    fireKey('Escape');
    expect(document.activeElement).not.toBe(input); // Should be blurred
    expect(mockHotkeysModal.closeHotkeysModal).toHaveBeenCalled();
    
    document.body.removeChild(input);
    unmount();
  });

  it('should toggle modal on F1', () => {
    renderHook(() => useGlobalHotkeys());
    
    fireKey('F1');
    expect(mockHotkeysModal.openHotkeysModal).toHaveBeenCalled();

    // Now if modal is open
    vi.mocked(useHotkeysModal).mockReturnValue({ ...mockHotkeysModal, isHotkeysModalOpen: true });
    const { unmount } = renderHook(() => useGlobalHotkeys());
    
    fireKey('F1');
    expect(mockHotkeysModal.closeHotkeysModal).toHaveBeenCalled();
    unmount();
  });

  it('should focus search input on /', () => {
    renderHook(() => useGlobalHotkeys());
    
    const searchInput = document.createElement('input');
    searchInput.id = 'search-input';
    document.body.appendChild(searchInput);

    fireKey('/');
    expect(document.activeElement).toBe(searchInput);

    document.body.removeChild(searchInput);
  });

  it('should toggle modal on Ctrl+/', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('/', { ctrlKey: true });
    expect(mockHotkeysModal.openHotkeysModal).toHaveBeenCalled();
  });

  it('should toggle modal on Shift+?', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('?', { shiftKey: true });
    expect(mockHotkeysModal.openHotkeysModal).toHaveBeenCalled();
  });

  it('should toggle play/pause on MediaPlayPause', () => {
    renderHook(() => useGlobalHotkeys());
    
    // When paused, should play
    fireKey('MediaPlayPause');
    expect(mockPlayer.play).toHaveBeenCalled();

    // When playing, should pause
    mockPlayer.isPlaying = true;
    vi.mocked(usePlayer).mockReturnValue({ ...mockPlayer, isPlaying: true });
    const { unmount } = renderHook(() => useGlobalHotkeys());
    fireKey('MediaPlayPause');
    expect(mockPlayer.pause).toHaveBeenCalled();
    unmount();
  });

  it('should debounce rapid MediaPlayPause key events to prevent double dispatch', () => {
    renderHook(() => useGlobalHotkeys());
    
    fireKey('MediaPlayPause');
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);

    // Immediate second press within 300ms should be debounced
    fireKey('MediaPlayPause');
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('should play next on MediaTrackNext', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('MediaTrackNext');
    expect(mockPlayer.next).toHaveBeenCalled();
  });

  it('should play prev on MediaTrackPrevious', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('MediaTrackPrevious');
    expect(mockPlayer.prev).toHaveBeenCalled();
  });

  it('should pause on MediaStop', () => {
    renderHook(() => useGlobalHotkeys());
    fireKey('MediaStop');
    expect(mockPlayer.pause).toHaveBeenCalled();
  });

  it('should allow media keys even when focus is in an input field', () => {
    renderHook(() => useGlobalHotkeys());
    
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    input.focus();

    fireKey('MediaPlayPause');
    expect(mockPlayer.play).toHaveBeenCalled();

    fireKey('MediaTrackNext');
    expect(mockPlayer.next).toHaveBeenCalled();

    input.blur();
    document.body.removeChild(input);
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useGlobalHotkeys());
    
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), { capture: true });
    removeEventListenerSpy.mockRestore();
  });
});
