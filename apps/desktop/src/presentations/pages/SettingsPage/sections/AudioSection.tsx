import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../../../application/hooks/useSettings';
import { useLanguage } from '../../../components/Language';
import { useAudioDevices } from '@music/hooks';
import { Volume2, Play } from 'lucide-react';

interface AudioSectionProps {
    searchQuery?: string;
}

export const AudioSection: React.FC<AudioSectionProps> = ({ searchQuery }) => {
    const { settings, updateSettings } = useSettings();
    const { t } = useLanguage();
    const { devices, currentDeviceId, setAudioDevice } = useAudioDevices();
    const [isPlayingTest, setIsPlayingTest] = useState(false);
    const [peakLevel, setPeakLevel] = useState(0);
    const animationRef = useRef<number | null>(null);

    const matchesSearch = (text: string) => {
        if (!searchQuery) return true;
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const showsDevice = matchesSearch(t('settings.audio.device')) || matchesSearch(t('settings.audio.deviceDesc'));
    const showsTest = matchesSearch(t('settings.audio.test')) || matchesSearch(t('settings.audio.testDesc'));

    if (searchQuery && !showsDevice && !showsTest) return null;

    // Sync currentDeviceId with settings if needed
    const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setAudioDevice(newId);
        updateSettings({ audio: { deviceId: newId } });
    };

    const handleTestSound = () => {
        if (isPlayingTest) return;

        setIsPlayingTest(true);
        // Play a simple beep/chime
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);

        oscillator.stop(audioContext.currentTime + 1.2);

        // Peak Level Animation
        let start = Date.now();
        const animate = () => {
            const elapsed = Date.now() - start;
            if (elapsed > 1200) {
                setPeakLevel(0);
                setIsPlayingTest(false);
                return;
            }

            // Simple mock peak level based on gain ramp
            const mockLevel = Math.max(0, 1 - Math.abs((elapsed - 500) / 500)) * 80;
            setPeakLevel(mockLevel + (Math.random() * 10)); // Add some jitter
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div className="settings-section">
            <div className="section-header">
                <Volume2 size={20} />
                <h2>{t('settings.audio.title')}</h2>
            </div>

            <div className="settings-group">
                {showsDevice && (
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>{t('settings.audio.device')}</h3>
                            <p>{t('settings.audio.deviceDesc')}</p>
                        </div>
                        <div className="setting-control">
                            <select 
                                value={currentDeviceId || settings.audio.deviceId} 
                                onChange={handleDeviceChange}
                            >
                                {devices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Device ${device.deviceId.slice(0, 5)}...`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {showsTest && (
                    <div className="setting-item vertical">
                        <div className="setting-info">
                            <h3>{t('settings.audio.test')}</h3>
                            <p>{t('settings.audio.testDesc')}</p>
                        </div>
                        <div className="audio-test-area">
                            <button 
                                className={`test-btn ${isPlayingTest ? 'active' : ''}`}
                                onClick={handleTestSound}
                                disabled={isPlayingTest}
                            >
                                <Play size={16} />
                                <span>{t('settings.audio.testBtn')}</span>
                            </button>
                            
                            <div className="peak-meter-container">
                                <div className="peak-meter-bg">
                                    <div 
                                        className="peak-meter-fill" 
                                        style={{ width: `${peakLevel}%` }}
                                    />
                                </div>
                                <div className="peak-meter-labels">
                                    <span>-inf</span>
                                    <span>-20dB</span>
                                    <span>-10dB</span>
                                    <span>0dB</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
