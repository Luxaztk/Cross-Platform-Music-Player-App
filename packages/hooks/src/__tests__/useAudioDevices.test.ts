import { renderHook, act, waitFor } from '@testing-library/react'; // Sử dụng waitFor
import { useAudioDevices } from '../useAudioDevices';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useAudioDevices', () => {
  const mockDevices = [
    { kind: 'audiooutput' as const, deviceId: 'default', label: 'Default Speaker', groupId: '', toJSON: vi.fn() },
    { kind: 'audiooutput' as const, deviceId: 'speaker-1', label: 'External Speaker', groupId: '', toJSON: vi.fn() },
    { kind: 'audioinput' as const, deviceId: 'mic-1', label: 'Microphone', groupId: '', toJSON: vi.fn() },
  ] as MediaDeviceInfo[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.mediaDevices với kiểu dữ liệu chuẩn
    const mockMediaDevices = {
      enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      mediaDevices: mockMediaDevices
    });
  });

  afterEach(() => {
    // FIX: Luôn dọn dẹp global stub để tránh side-effects
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should enumerate audio output devices on mount', async () => {
    const { result } = renderHook(() => useAudioDevices());

    // FIX: Dùng waitFor thay vì setTimeout thủ công
    await waitFor(() => {
      const outputDevices = mockDevices.filter(d => d.kind === 'audiooutput');
      expect(result.current.devices).toHaveLength(outputDevices.length);
    });

    expect(result.current.devices[1].deviceId).toBe('speaker-1');
  });

  it('should update devices when devicechange event occurs', async () => {
    let changeHandler: EventListener = () => { }; // FIX: Dùng kiểu EventListener thay vì any
    const mockMediaDevices = vi.mocked(navigator.mediaDevices);

    // Ép kiểu mock một cách an toàn
    mockMediaDevices.addEventListener.mockImplementation(((event: string, handler: EventListener) => {
      if (event === 'devicechange') changeHandler = handler;
    }) as any);

    const { result } = renderHook(() => useAudioDevices());

    // Đợi mount lần đầu
    await waitFor(() => expect(result.current.devices.length).toBeGreaterThan(0));

    // Simulate change
    const newDevices = [
      ...mockDevices,
      { kind: 'audiooutput' as const, deviceId: 'speaker-2', label: 'Headphones', groupId: '', toJSON: vi.fn() } as MediaDeviceInfo
    ];
    mockMediaDevices.enumerateDevices.mockResolvedValue(newDevices);

    // Kích hoạt handler giả lập
    await act(async () => {
      changeHandler(new Event('devicechange'));
    });

    await waitFor(() => expect(result.current.devices).toHaveLength(3));
    expect(result.current.devices[2].deviceId).toBe('speaker-2');
  });

  it('should set currentDeviceId and persist to localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useAudioDevices());

    await act(async () => {
      result.current.setAudioDevice('speaker-1');
    });

    expect(result.current.currentDeviceId).toBe('speaker-1');
    expect(setItemSpy).toHaveBeenCalledWith('audio-device-id', 'speaker-1');
  });

  it('should handle missing mediaDevices support gracefully', async () => {
    vi.stubGlobal('navigator', {}); // mediaDevices missing hoàn toàn
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    const { result } = renderHook(() => useAudioDevices());

    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(consoleSpy).toHaveBeenCalledWith('enumerateDevices is not supported.');
  });
});