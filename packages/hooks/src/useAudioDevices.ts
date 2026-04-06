import { useState, useEffect, useCallback } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

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
    fetchDevices();
    // Listen for plugged/unplugged devices
    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
      navigator.mediaDevices.addEventListener('devicechange', fetchDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
      };
    }
  }, [fetchDevices]);

  useEffect(() => {
    const handleExternalChange = (e: any) => {
      if (e.detail) {
        setCurrentDeviceId(e.detail);
      }
    };
    window.addEventListener('audiodevicechange', handleExternalChange);
    return () => window.removeEventListener('audiodevicechange', handleExternalChange);
  }, []);

  const setAudioDevice = useCallback((deviceId: string) => {
    setCurrentDeviceId(deviceId);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app_audio_device', deviceId);
    }
    window.dispatchEvent(new CustomEvent('audiodevicechange', { detail: deviceId }));
  }, []);

  return { devices, currentDeviceId, setAudioDevice, fetchDevices };
};
