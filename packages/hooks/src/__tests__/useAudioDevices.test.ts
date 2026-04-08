import { renderHook, act } from '@testing-library/react';
import { useAudioDevices } from '../useAudioDevices';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useAudioDevices', () => {
  const mockDevices = [
    { kind: 'audiooutput', deviceId: 'default', label: 'Default Speaker' },
    { kind: 'audiooutput', deviceId: 'speaker-1', label: 'External Speaker' },
    { kind: 'audioinput', deviceId: 'mic-1', label: 'Microphone' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.mediaDevices
    const mockMediaDevices = {
      enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    vi.stubGlobal('navigator', {
      mediaDevices: mockMediaDevices
    });
  });

  it('should enumerate audio output devices on mount', async () => {
    const { result } = renderHook(() => useAudioDevices());

    // Initially empty
    expect(result.current.devices).toEqual([]);

    // Wait for effect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const outputDevices = mockDevices.filter(d => d.kind === 'audiooutput');
    expect(result.current.devices).toHaveLength(outputDevices.length);
    expect(result.current.devices[1].deviceId).toBe('speaker-1');
  });

  it('should update devices when devicechange event occurs', async () => {
    let changeHandler: any;
    const mockMediaDevices = (navigator as any).mediaDevices;
    mockMediaDevices.addEventListener.mockImplementation((event: string, handler: any) => {
      if (event === 'devicechange') changeHandler = handler;
    });

    const { result } = renderHook(() => useAudioDevices());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Simulate change
    const newDevices = [...mockDevices, { kind: 'audiooutput', deviceId: 'speaker-2', label: 'Headphones' }];
    mockMediaDevices.enumerateDevices.mockResolvedValue(newDevices);

    await act(async () => {
      changeHandler();
    });

    expect(result.current.devices).toHaveLength(3);
    expect(result.current.devices[2].deviceId).toBe('speaker-2');
  });

  it('should set currentDeviceId', async () => {
    const { result } = renderHook(() => useAudioDevices());

    await act(async () => {
      result.current.setAudioDevice('speaker-1');
    });

    expect(result.current.currentDeviceId).toBe('speaker-1');
  });

  it('should handle missing mediaDevices support', async () => {
    vi.stubGlobal('navigator', {}); // mediaDevices missing
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useAudioDevices());
    
    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(consoleSpy).toHaveBeenCalledWith('enumerateDevices is not supported.');
    consoleSpy.mockRestore();
  });

  it('should handle errors in enumerateDevices', async () => {
    const error = new Error('Permission denied');
    (navigator as any).mediaDevices.enumerateDevices.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAudioDevices());

    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching audio devices', error);
    consoleSpy.mockRestore();
  });

  it('should fallback to default device when localStorage is empty', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    });
    const { result } = renderHook(() => useAudioDevices());
    
    // Wait for mount effect (fetchDevices) to avoid act warning
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.currentDeviceId).toBe('default');
  });
});
