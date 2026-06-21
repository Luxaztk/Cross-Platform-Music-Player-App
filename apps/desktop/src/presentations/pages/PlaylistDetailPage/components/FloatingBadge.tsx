import React, { useState, useEffect } from 'react';
import { MousePointer2 } from 'lucide-react';
import './FloatingBadge.scss';

export const FloatingBadge: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [modifier, setModifier] = useState<'Ctrl' | 'Shift' | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setModifier('Ctrl');
        setIsVisible(true);
      } else if (e.shiftKey) {
        setModifier('Shift');
        setIsVisible(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        setIsVisible(false);
        setModifier(null);
      } else if (e.ctrlKey || e.metaKey) {
        setModifier('Ctrl');
      } else if (e.shiftKey) {
        setModifier('Shift');
      }
    };

    // Add listeners to window
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Also handle window blur so badge doesn't get stuck
    const handleBlur = () => {
      setIsVisible(false);
      setModifier(null);
    };
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div className={`floating-badge-container ${isVisible ? 'visible' : ''}`}>
      <div className="floating-badge-content">
        <MousePointer2 size={16} className="badge-icon" />
        <span>
          Đang ở chế độ chọn {modifier === 'Shift' ? 'dải' : 'nhiều'} bài. 
          Click vào các dòng để bôi đen.
        </span>
      </div>
    </div>
  );
};
