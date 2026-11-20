import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { textMatches } from '@application/utils/searchUtils';

interface UseCreatableMetadataInputOptions {
  options: string[];
  values: string[];
  multiple: boolean;
  parseValue?: (value: string) => string[];
  onChange: (values: string[]) => void;
}

const normalizeKey = (value: string): string => value
  .normalize('NFC')
  .trim()
  .toLocaleLowerCase();

export const useCreatableMetadataInput = ({
  options,
  values,
  multiple,
  parseValue,
  onChange,
}: UseCreatableMetadataInputOptions) => {
  const [multiQuery, setMultiQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const comboboxElementRef = useRef<HTMLDivElement | null>(null);
  const inputElementRef = useRef<HTMLInputElement | null>(null);
  const singleValue = multiple ? '' : (values[0] ?? '');
  const query = multiple ? multiQuery : singleValue;

  const selectedKeys = useMemo(
    () => new Set(values.map(normalizeKey)),
    [values]
  );
  const normalizedQuery = normalizeKey(query);
  const parsedQueryValues = useMemo(() => {
    if (!normalizedQuery) return [];
    const parsedValues = multiple && parseValue ? parseValue(query) : [query.trim()];
    return parsedValues.map((value) => value.trim()).filter(Boolean);
  }, [multiple, normalizedQuery, parseValue, query]);
  const parsedQueryKeys = useMemo(
    () => new Set(parsedQueryValues.map(normalizeKey)),
    [parsedQueryValues]
  );

  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      const optionKey = normalizeKey(option);
      if (multiple && selectedKeys.has(optionKey)) return false;
      return !normalizedQuery
        || textMatches(option, query)
        || parsedQueryKeys.has(optionKey);
    });
  }, [multiple, normalizedQuery, options, parsedQueryKeys, query, selectedKeys]);

  const availableKeys = useMemo(
    () => new Set([...options.map(normalizeKey), ...selectedKeys]),
    [options, selectedKeys]
  );
  const canCreate = Boolean(normalizedQuery)
    && parsedQueryValues.some((value) => !availableKeys.has(normalizeKey(value)));
  const itemCount = filteredOptions.length + (canCreate ? 1 : 0);

  const selectValue = useCallback((rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return;

    if (multiple) {
      const parsedValues = (parseValue ? parseValue(value) : [value])
        .map((parsedValue) => parsedValue.trim())
        .filter(Boolean);
      const nextValues = [...values];
      const nextKeys = new Set(values.map(normalizeKey));

      parsedValues.forEach((parsedValue) => {
        const parsedKey = normalizeKey(parsedValue);
        if (!nextKeys.has(parsedKey)) {
          nextKeys.add(parsedKey);
          nextValues.push(parsedValue);
        }
      });

      if (nextValues.length !== values.length) {
        onChange(nextValues);
      }
      setMultiQuery('');
      setIsOpen(true);
      setActiveIndex(0);
      inputElementRef.current?.focus();
      return;
    }

    onChange([value]);
    setIsOpen(false);
  }, [multiple, onChange, parseValue, values]);

  const removeValue = useCallback((value: string) => {
    onChange(values.filter((selected) => normalizeKey(selected) !== normalizeKey(value)));
  }, [onChange, values]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setIsOpen(true);
    setActiveIndex(0);

    if (multiple) {
      setMultiQuery(nextQuery);
    } else {
      onChange(nextQuery ? [nextQuery] : []);
    }
  }, [multiple, onChange]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => itemCount > 0 ? (current + 1) % itemCount : 0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => itemCount > 0 ? (current - 1 + itemCount) % itemCount : 0);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const activeOption = filteredOptions[activeIndex];
      if (activeOption) {
        selectValue(activeOption);
      } else if (canCreate) {
        selectValue(query);
      }
      return;
    }

    if (event.key === 'Backspace' && multiple && !query && values.length > 0) {
      removeValue(values[values.length - 1]);
      return;
    }

    if (event.key === 'Escape') {
      event.stopPropagation();
      setIsOpen(false);
    }
  }, [activeIndex, canCreate, filteredOptions, itemCount, multiple, query, removeValue, selectValue, values]);

  const handleFocus = useCallback(() => {
    setIsOpen(true);
    setActiveIndex(0);
  }, []);

  const handleBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
    const combobox = comboboxElementRef.current;
    if (!combobox?.contains(event.relatedTarget as Node | null)) {
      if (multiple && query.trim()) {
        selectValue(query);
      }
      setIsOpen(false);
    }
  }, [multiple, query, selectValue]);

  const setComboboxElement = useCallback((element: HTMLDivElement | null) => {
    comboboxElementRef.current = element;
  }, []);

  const setInputElement = useCallback((element: HTMLInputElement | null) => {
    inputElementRef.current = element;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || comboboxElementRef.current?.contains(target)) return;

      if (multiple && query.trim()) {
        selectValue(query);
      }
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
  }, [isOpen, multiple, query, selectValue]);

  return {
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
  };
};
