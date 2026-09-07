import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { User, X, Plus } from 'lucide-react';
import type { ServerUserSummary } from '@music/types';
import { useLanguage } from '@hooks';
import { textMatches } from '@application/utils/searchUtils';

interface WhitelistBadgeInputProps {
  value: string[];
  onChange: (whitelist: string[]) => void;
  availableUsers?: ServerUserSummary[];
  currentUsername?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const WhitelistBadgeInput: React.FC<WhitelistBadgeInputProps> = ({
  value,
  onChange,
  availableUsers = [],
  currentUsername = '',
  placeholder,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const effectivePlaceholder =
    placeholder ??
    t('settings.server.whitelistBadgePlaceholder', {
      defaultValue: 'Tìm hoặc nhập tên bạn bè...',
    });

  // Normalize lower value list for case-insensitive duplicate checks
  const existingSet = useMemo(
    () => new Set(value.map((v) => v.toLowerCase())),
    [value]
  );

  // Filter matching users from server (exclude current user and already added users)
  const matchingUsers = useMemo(() => {
    const cleanSelf = currentUsername.trim().toLowerCase();
    return availableUsers.filter((u) => {
      const uLower = u.username.toLowerCase();
      if (cleanSelf && uLower === cleanSelf) return false;
      if (existingSet.has(uLower)) return false;
      if (!query.trim()) return true;
      return textMatches(u.username, query);
    });
  }, [availableUsers, currentUsername, existingSet, query]);

  // Check if query allows adding as a new custom username
  const canAddCustom = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return false;
    const trimmedLower = trimmed.toLowerCase();
    if (trimmedLower === currentUsername.trim().toLowerCase()) return false;
    if (existingSet.has(trimmedLower)) return false;
    // If exact match already exists in matchingUsers, preferred to select from list
    const exactMatch = matchingUsers.some(
      (u) => u.username.toLowerCase() === trimmedLower
    );
    return !exactMatch;
  }, [query, currentUsername, existingSet, matchingUsers]);

  const totalOptionsCount = matchingUsers.length + (canAddCustom ? 1 : 0);

  // Click outside to close dropdown
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
      setIsOpen(true);
    }
  };

  const handleAdd = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (existingSet.has(trimmed.toLowerCase())) return;

      onChange([...value, trimmed]);
      setQuery('');
      setHighlightedIndex(-1);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [existingSet, onChange, value]
  );

  const handleRemove = useCallback(
    (nameToRemove: string) => {
      onChange(value.filter((v) => v !== nameToRemove));
    },
    [onChange, value]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else if (totalOptionsCount > 0) {
        setHighlightedIndex((prev) => (prev + 1) % totalOptionsCount);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && totalOptionsCount > 0) {
        setHighlightedIndex((prev) =>
          prev <= 0 ? totalOptionsCount - 1 : prev - 1
        );
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (
        isOpen &&
        highlightedIndex >= 0 &&
        highlightedIndex < matchingUsers.length
      ) {
        handleAdd(matchingUsers[highlightedIndex].username);
      } else if (
        isOpen &&
        canAddCustom &&
        highlightedIndex === matchingUsers.length
      ) {
        handleAdd(query);
      } else if (query.trim()) {
        handleAdd(query);
      }
      return;
    }

    if (e.key === ',') {
      e.preventDefault();
      if (query.trim()) {
        handleAdd(query);
      }
      return;
    }

    if (e.key === 'Backspace' && query === '' && value.length > 0) {
      // Remove last badge
      handleRemove(value[value.length - 1]);
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div
      className={`whitelist-badge-input-container ${disabled ? 'disabled' : ''} ${isOpen ? 'focused' : ''}`}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="badge-and-input-flow">
        {value.map((username) => (
          <span key={username} className="whitelist-badge" data-testid={`badge-${username}`}>
            <User size={12} className="badge-icon" />
            <span className="badge-text">{username}</span>
            <button
              type="button"
              className="badge-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(username);
              }}
              title={t('common.remove', { defaultValue: 'Xóa' })}
              aria-label={`Remove ${username}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          className="whitelist-search-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? effectivePlaceholder : ''}
          disabled={disabled}
        />
      </div>

      {isOpen && (
        <div className="whitelist-suggestions-dropdown" role="listbox">
          {matchingUsers.map((user, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <button
                key={user.username}
                type="button"
                role="option"
                aria-selected={isHighlighted}
                className={`suggestion-item ${isHighlighted ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd(user.username);
                }}
              >
                <div className="suggestion-user-info">
                  <User size={14} className="suggestion-user-icon" />
                  <span className="suggestion-username">{user.username}</span>
                </div>
                <span className="suggestion-song-count">
                  {user.songCount} {t('settings.server.songsShort', { defaultValue: 'bài' })}
                </span>
              </button>
            );
          })}

          {canAddCustom && (
            <button
              type="button"
              role="option"
              aria-selected={highlightedIndex === matchingUsers.length}
              className={`suggestion-item add-custom ${
                highlightedIndex === matchingUsers.length ? 'active' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleAdd(query);
              }}
            >
              <div className="suggestion-user-info">
                <Plus size={14} className="suggestion-user-icon" />
                <span className="suggestion-username">
                  {t('settings.server.whitelistAddCustom', {
                    name: query.trim(),
                    defaultValue: `Thêm "${query.trim()}" vào Whitelist`,
                  })}
                </span>
              </div>
            </button>
          )}

          {matchingUsers.length === 0 && !canAddCustom && query.trim() && (
            <div className="suggestion-empty-state">
              {t('settings.server.whitelistNoUsers', {
                defaultValue: 'Không tìm thấy người dùng phù hợp',
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
