import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';
import './CustomDropdown.scss';

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  icon,
  title,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (optionValue: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(optionValue);
    setIsOpen(false);
  };

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: menuPosition.top,
    left: menuPosition.left,
    width: menuPosition.width,
    zIndex: 10000,
  };

  return (
    <div className={`custom-dropdown-container ${className}`} ref={containerRef} title={title}>
      <button
        type="button"
        className={`dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="trigger-left">
          {icon && <span className="trigger-icon">{icon}</span>}
          <span className="trigger-label">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen &&
        ReactDOM.createPortal(
          <div 
            className="dropdown-portal-menu" 
            style={menuStyle} 
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            role="listbox"
          >
            <div className="dropdown-items-list" role="presentation">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={String(option.value) === String(value)}
                  className={`dropdown-item ${String(option.value) === String(value) ? 'selected' : ''}`}
                  onClick={(e) => handleSelect(option.value, e)}
                >
                  <span className="item-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
