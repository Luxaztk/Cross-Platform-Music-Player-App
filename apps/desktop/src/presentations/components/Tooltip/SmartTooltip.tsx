import React, { useState, useRef, useLayoutEffect, type ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface SmartTooltipProps {
  children: ReactNode;
  content: string;
}

const HEADER_HEIGHT = 64;
const PLAYER_BAR_HEIGHT = 90;
const EDGE_PADDING = 12;

export const SmartTooltip: React.FC<SmartTooltipProps> = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: -9999, left: -9999 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // 1. VERTICAL POSITIONING (Flip Logic)
      let calculatedTop = triggerRect.bottom + 8;

      if (calculatedTop + tooltipRect.height > window.innerHeight - PLAYER_BAR_HEIGHT) {
        calculatedTop = triggerRect.top - tooltipRect.height - 8;

        if (calculatedTop < HEADER_HEIGHT) {
          calculatedTop = HEADER_HEIGHT + 8;
        }
      }

      // 2. HORIZONTAL POSITIONING (Center with Edge Clamping)
      let calculatedLeft = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

      if (calculatedLeft < EDGE_PADDING) {
        calculatedLeft = EDGE_PADDING;
      }
      else if (calculatedLeft + tooltipRect.width > window.innerWidth - EDGE_PADDING) {
        calculatedLeft = window.innerWidth - tooltipRect.width - EDGE_PADDING;
      }

      setCoords({ top: calculatedTop, left: calculatedLeft });

      // Hide tooltip on scroll to prevent it from floating over other elements
      const handleScroll = () => {
        setIsVisible(false);
        setCoords({ top: -9999, left: -9999 });
      };

      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => {
          setIsVisible(false);
          setCoords({ top: -9999, left: -9999 });
        }}
        style={{ display: 'inline-flex' }}
      >
        {children}
      </div>
      {isVisible && ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            backgroundColor: '#282828',
            color: '#EFEFEF',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.4',
            maxWidth: '255px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            zIndex: 99999,
            pointerEvents: 'none',
            opacity: isVisible && coords.top !== -9999 ? 1 : 0,
            transition: 'opacity 0.2s ease',
            fontFamily: 'sans-serif',
            wordWrap: 'break-word',
            textAlign: 'justify'
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};
