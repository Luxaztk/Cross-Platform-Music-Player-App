import React from 'react';
import { X } from 'lucide-react';
import { useCreatableMetadataInput } from './useCreatableMetadataInput';
import type { CreatableMetadataInputProps } from './types';

export const CreatableMetadataInput: React.FC<CreatableMetadataInputProps> = ({
  id,
  label,
  placeholder,
  options,
  values,
  multiple = false,
  createLabel,
  noResultsLabel,
  removeValueLabel,
  parseValue,
  onChange,
}) => {
  const {
    query,
    isOpen,
    activeIndex,
    filteredOptions,
    canCreate,
    selectValue,
    removeValue,
    handleInputChange,
    handleKeyDown,
    handleFocus,
    handleBlur,
    setComboboxElement,
    setInputElement,
  } = useCreatableMetadataInput({ options, values, multiple, parseValue, onChange });
  const listboxId = `${id}-listbox`;

  return (
    <div className="input-group metadata-input-group">
      <label className="input-label" htmlFor={id}>{label}</label>
      <div className="metadata-combobox" ref={setComboboxElement}>
        <div className={`metadata-combobox-control ${multiple ? 'is-multiple' : ''}`}>
          {multiple && values.map((value) => (
            <span className="metadata-chip" key={value}>
              <span>{value}</span>
              <button
                type="button"
                className="metadata-chip-remove"
                aria-label={`${removeValueLabel}: ${value}`}
                onClick={() => removeValue(value)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            ref={setInputElement}
            id={id}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-label={label}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="metadata-combobox-input"
          />
        </div>

        {isOpen && (
          <div className="metadata-options" id={listboxId} role="listbox">
            {filteredOptions.map((option, index) => (
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`metadata-option ${index === activeIndex ? 'is-active' : ''}`}
                key={option}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => selectValue(option)}
              >
                {option}
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                role="option"
                aria-selected={activeIndex === filteredOptions.length}
                className={`metadata-option create-option ${activeIndex === filteredOptions.length ? 'is-active' : ''}`}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => selectValue(query)}
              >
                {createLabel} “{query.trim()}”
              </button>
            )}
            {filteredOptions.length === 0 && !canCreate && (
              <span className="metadata-no-results">{noResultsLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
