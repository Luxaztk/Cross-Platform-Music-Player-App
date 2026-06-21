import React, { useState, useEffect } from 'react';
import { Lightbulb, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@hooks';
import './DidYouKnow.scss';

const TIP_KEYS = [
  'sidebar.didYouKnow.tip1',
  'sidebar.didYouKnow.tip2',
  'sidebar.didYouKnow.tip3',
  'sidebar.didYouKnow.tip4',
  'sidebar.didYouKnow.tip5'
];

export const DidYouKnow: React.FC = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('hide_did_you_know') !== 'true';
  });
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * TIP_KEYS.length));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsVisible(localStorage.getItem('hide_did_you_know') !== 'true');
    };
    
    window.addEventListener('did_you_know_changed', handleStorageChange);
    return () => {
      window.removeEventListener('did_you_know_changed', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TIP_KEYS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('hide_did_you_know', 'true');
    window.dispatchEvent(new Event('did_you_know_changed'));
  };

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % TIP_KEYS.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + TIP_KEYS.length) % TIP_KEYS.length);

  if (!isVisible) return null;

  return (
    <div className="did-you-know-container">
      <button className="close-btn" onClick={handleDismiss} title={t('sidebar.didYouKnow.close')}>
        <X size={12} />
      </button>
      <div className="tip-header">
        <Lightbulb size={14} className="bulb-icon" />
        <span className="tip-title">{t('sidebar.didYouKnow.title')}</span>
      </div>
      <p className="tip-content">{t(TIP_KEYS[currentIndex])}</p>
      
      <div className="tip-controls">
        <button className="control-btn" onClick={handlePrev} title={t('sidebar.didYouKnow.prevTip')}>
          <ChevronLeft size={14} />
        </button>
        <span className="tip-indicator">{currentIndex + 1} / {TIP_KEYS.length}</span>
        <button className="control-btn" onClick={handleNext} title={t('sidebar.didYouKnow.nextTip')}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
