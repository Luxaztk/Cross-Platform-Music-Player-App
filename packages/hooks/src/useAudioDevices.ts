import { useState, useEffect, useCallback } from 'react';
import type { AudioDevice } from './types/index';





export const useAudioDevices = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('app_audio_device') || 'default';
    }
    return 'default';
  });

  const fetchDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn('enumerateDevices is not supported.');
        return;
      }
      
      const rawDevices = await navigator.mediaDevices.enumerateDevices();
      const outputDevices = rawDevices
        .filter(device => device.kind === 'audiooutput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker/Headphone ${index + 1}`,
          kind: device.kind
        }));
      
      setDevices(outputDevices);
    } catch (err) {
      console.error('Error fetching audio devices', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchDevices();
    };
    init();

    // Listen for plugged/unplugged devices
    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
      navigator.mediaDevices.addEventListener('devicechange', fetchDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
      };
    }
  }, [fetchDevices]);

  useEffect(() => {
    const handleExternalChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentDeviceId(customEvent.detail);
      }
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('audiodevicechange', handleExternalChange);
      return () => window.removeEventListener('audiodevicechange', handleExternalChange);
    }
    return () => {};
  }, []);

  const setAudioDevice = useCallback((deviceId: string) => {
    setCurrentDeviceId(deviceId);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app_audio_device', deviceId);
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('audiodevicechange', { detail: deviceId }));
    }
  }, []);

  return { devices, currentDeviceId, setAudioDevice, fetchDevices };
};
