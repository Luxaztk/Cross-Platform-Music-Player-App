import React, { useState, useEffect, useRef } from 'react';
import { useSettings, useLanguage } from '@hooks';
import { ICON_SIZES } from '@constants';
import { useAudioDevices, usePlayer } from '@music/hooks';
import { Volume2, Play, HelpCircle } from 'lucide-react';
import { CustomDropdown, SmartTooltip } from '@components';
import { 
    type AudioSectionProps, 
    PEAK_METER_MIN_DB, 
    PEAK_METER_MAX_DB, 
    PEAK_METER_CLIPPING_THRESHOLD,
    matchesSearch
} from '../utils';

export const AudioSection: React.FC<AudioSectionProps> = ({ searchQuery }) => {
    const { settings, updateSettings } = useSettings();
    const { t } = useLanguage();
    const { isPlaying, getAnalyser } = usePlayer();
    const { devices, currentDeviceId, setAudioDevice } = useAudioDevices();
    const [isPlayingTest, setIsPlayingTest] = useState(false);
    const meterFillRef = useRef<HTMLDivElement>(null);

    const testAudioContextRef = useRef<AudioContext | null>(null);
    const testTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showsDevice = matchesSearch(t('settings.audio.device'), searchQuery) || matchesSearch(t('settings.audio.deviceDesc'), searchQuery);
    const showsTest = matchesSearch(t('settings.audio.test'), searchQuery) || matchesSearch(t('settings.audio.testDesc'), searchQuery);

    useEffect(() => {
        return () => {
            if (testTimerRef.current) {
                clearTimeout(testTimerRef.current);
                testTimerRef.current = null;
            }
            if (testAudioContextRef.current && testAudioContextRef.current.state !== 'closed') {
                testAudioContextRef.current.close().catch(() => {});
                testAudioContextRef.current = null;
            }
        };
    }, []);

    const handleDeviceChange = (newId: string | number) => {
        const idStr = String(newId);
        setAudioDevice(idStr);
        updateSettings({ audio: { deviceId: idStr } });
    };

    useEffect(() => {
        // High-frequency animation loop
        const start = Date.now();
        let frameId: number;

        // Use Float32Array for high-precision dBFS calculation
        const dataArray = new Float32Array(128);

        const animate = () => {
            const analyser = getAnalyser();
            let level = 0;
            let isClipping = false;

            if (isPlaying && analyser) {
                // REAL AUDIO: Calculate true RMS and Peak from Float32Array
                analyser.getFloatTimeDomainData(dataArray);

                let sumSquares = 0;
                let peak = 0;

                for (let i = 0; i < dataArray.length; i++) {
                    const absValue = Math.abs(dataArray[i]);
                    sumSquares += absValue * absValue;
                    if (absValue > peak) peak = absValue;
                }

                const rms = Math.sqrt(sumSquares / dataArray.length);
                const rmsDb = rms > 0 ? 20 * Math.log10(rms) : PEAK_METER_MIN_DB;
                const peakDb = peak > 0 ? 20 * Math.log10(peak) : PEAK_METER_MIN_DB;

                // Clipping detection: Peak > -0.1 dBFS
                isClipping = peakDb >= PEAK_METER_CLIPPING_THRESHOLD;

                // Map RMS dB (-60 dB to 0 dB) to 0 - 100% percentage
                const normalizedLevel = ((rmsDb - PEAK_METER_MIN_DB) / (PEAK_METER_MAX_DB - PEAK_METER_MIN_DB)) * 100;
                level = Math.max(0, Math.min(100, normalizedLevel));
            } else if (isPlayingTest) {
                // TEST SOUND ANIMATION: Synthetic wave simulation
                const elapsed = Date.now() - start;
                if (elapsed > 1200) {
                    level = 0;
                } else {
                    if (elapsed < 200) level = (elapsed / 200) * 85;
                    else if (elapsed < 900) level = 85 + (Math.random() * 10);
                    else level = ((1100 - elapsed) / 200) * 85;
                }
            }

            // DIRECT DOM MUTATION for performance
            if (meterFillRef.current) {
                const fill = meterFillRef.current;
                fill.style.width = `${Math.max(0, level)}%`;
                
                if (isClipping) {
                    fill.style.background = '#ff0000'; // Clipping warning
                    fill.style.boxShadow = '0 0 15px #ff0000';
                } else {
                    fill.style.background = 'linear-gradient(90deg, #4caf50, #fdd835)';
                    fill.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.4)';
                }
            }
            
            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, [isPlaying, isPlayingTest, getAnalyser]);

    const handleTestSound = async () => {
        if (isPlayingTest || isPlaying) return;

        setIsPlayingTest(true);

        if (testTimerRef.current) {
            clearTimeout(testTimerRef.current);
            testTimerRef.current = null;
        }
        if (testAudioContextRef.current && testAudioContextRef.current.state !== 'closed') {
            testAudioContextRef.current.close().catch(() => {});
            testAudioContextRef.current = null;
        }
        
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextClass();
        testAudioContextRef.current = audioContext;

        // Apply selected output device to the test context
        if (currentDeviceId && 'setSinkId' in audioContext && typeof (audioContext as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId === 'function') {
            try {
                await (audioContext as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(currentDeviceId === 'default' ? '' : currentDeviceId);
            } catch (e) {
                console.error('Failed to set sinkId on test audioContext:', e);
            }
        }

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);

        oscillator.stop(audioContext.currentTime + 1.2);

        testTimerRef.current = setTimeout(() => {
            if (audioContext.state !== 'closed') {
                audioContext.close().catch(() => {});
            }
            if (testAudioContextRef.current === audioContext) {
                testAudioContextRef.current = null;
            }
            testTimerRef.current = null;
            setIsPlayingTest(false);
        }, 1300);
    };

    if (searchQuery && !showsDevice && !showsTest) return null;

    return (
        <div className="settings-section">
            <div className="section-header">
                <Volume2 size={ICON_SIZES.MEDIUM} />
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
                            <CustomDropdown
                                value={currentDeviceId || settings.audio.deviceId}
                                onChange={handleDeviceChange}
                                options={devices.map((device) => ({
                                    value: device.deviceId,
                                    label: device.label || `Device ${device.deviceId.slice(0, 5)}...`,
                                }))}
                                title={t('settings.audio.deviceSelect')}
                            />
                        </div>
                    </div>
                )}

                {showsTest && (
                    <>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>{t('settings.audio.test')}</h3>
                                <p>{t('settings.audio.testDesc')}</p>
                            </div>
                            <button 
                                type="button"
                                className={`test-btn-mini ${isPlayingTest ? 'active' : ''}`}
                                onClick={handleTestSound}
                                disabled={isPlayingTest || isPlaying}
                                title={isPlaying ? "Disabled while playing music" : ""}
                            >
                                <Play size={14} fill="currentColor" />
                                <span>{t('settings.audio.testBtn')}</span>
                            </button>
                        </div>
                        
                        <div className="audio-test-area">
                            <div className="peak-meter-header">
                                <span className="peak-meter-label">{t('settings.audio.peakMeter')}</span>
                                <SmartTooltip content={t('settings.audio.peakMeterTooltip')}>
                                    <div className="tooltip-container">
                                        <HelpCircle size={14} className="tooltip-icon" />
                                    </div>
                                </SmartTooltip>
                            </div>
                            <div className="peak-meter-container">
                                <div className="peak-meter-bg">
                                    <div 
                                        ref={meterFillRef}
                                        className="peak-meter-fill" 
                                        style={{ width: '0%' }}
                                    />
                                </div>
                                <div className="peak-meter-labels">
                                    <span>-60dB</span>
                                    <span>-40dB</span>
                                    <span>-20dB</span>
                                    <span>0dB</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
