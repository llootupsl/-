/**
 * =============================================================================
 * Input 统一输入组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { forwardRef, memo, useState, useCallback, type InputHTMLAttributes, type CSSProperties } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputStatus = 'default' | 'warning' | 'error' | 'success';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
  size?: InputSize;
  status?: InputStatus;
  label?: string;
  hint?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  allowClear?: boolean;
  showCount?: boolean;
  maxLength?: number;
  block?: boolean;
  className?: string;
  style?: CSSProperties;
}

const SIZE_STYLES: Record<InputSize, CSSProperties> = {
  sm: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
  md: { padding: '0.5rem 0.75rem', fontSize: '0.85rem' },
  lg: { padding: '0.75rem 1rem', fontSize: '1rem' },
};

export const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(
    (
      {
        size = 'md',
        status = 'default',
        label,
        hint,
        error,
        prefix,
        suffix,
        allowClear = false,
        showCount = false,
        maxLength,
        block = false,
        className = '',
        style,
        value,
        defaultValue,
        onChange,
        disabled,
        ...rest
      },
      ref
    ) => {
      const [internalValue, setInternalValue] = useState(defaultValue ?? '');
      const currentValue = value ?? internalValue;
      const actualStatus = error ? 'error' : status;

      const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          setInternalValue(e.target.value);
          onChange?.(e);
        },
        [onChange]
      );

      const handleClear = useCallback(() => {
        setInternalValue('');
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      }, [onChange]);

      const inputStyle: CSSProperties = {
        ...SIZE_STYLES[size],
        ...(block ? { width: '100%' } : {}),
        ...style,
      };

      const inputId = rest.id || rest.name;

      return (
        <div className={`input-wrapper input-${size} input-${actualStatus} ${block ? 'input-block' : ''} ${disabled ? 'input-disabled' : ''} ${className}`}>
          {label && (
            <label htmlFor={inputId} className="input-label">
              {label}
            </label>
          )}
          <div className="input-container" style={inputStyle}>
            {prefix && <span className="input-prefix">{prefix}</span>}
            <input
              ref={ref}
              id={inputId}
              value={currentValue}
              onChange={handleChange}
              disabled={disabled}
              maxLength={maxLength}
              className="input-field"
              {...rest}
            />
            {allowClear && currentValue && !disabled && (
              <button type="button" className="input-clear" onClick={handleClear} tabIndex={-1}>
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
            {suffix && <span className="input-suffix">{suffix}</span>}
            {showCount && maxLength && (
              <span className="input-count">
                {String(currentValue).length}/{maxLength}
              </span>
            )}
          </div>
          {(error || hint) && (
            <span className={`input-message input-message-${error ? 'error' : 'hint'}`}>
              {error || hint}
            </span>
          )}
        </div>
      );
    }
  )
);

Input.displayName = 'Input';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
  status?: InputStatus;
  label?: string;
  hint?: string;
  error?: string;
  showCount?: boolean;
  maxLength?: number;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  className?: string;
  style?: CSSProperties;
}

export const Textarea = memo(
  forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
      {
        size = 'md',
        status = 'default',
        label,
        hint,
        error,
        showCount = false,
        maxLength,
        autoSize,
        className = '',
        style,
        value,
        defaultValue,
        onChange,
        disabled,
        ...rest
      },
      ref
    ) => {
      const [internalValue, setInternalValue] = useState(defaultValue ?? '');
      const currentValue = value ?? internalValue;
      const actualStatus = error ? 'error' : status;

      const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setInternalValue(e.target.value);
          onChange?.(e);
        },
        [onChange]
      );

      const textareaId = rest.id || rest.name;

      return (
        <div className={`textarea-wrapper textarea-${size} textarea-${actualStatus} ${disabled ? 'textarea-disabled' : ''} ${className}`}>
          {label && (
            <label htmlFor={textareaId} className="textarea-label">
              {label}
            </label>
          )}
          <textarea
            ref={ref}
            id={textareaId}
            value={currentValue}
            onChange={handleChange}
            disabled={disabled}
            maxLength={maxLength}
            className="textarea-field"
            style={style}
            {...rest}
          />
          {showCount && maxLength && (
            <span className="textarea-count">
              {String(currentValue).length}/{maxLength}
            </span>
          )}
          {(error || hint) && (
            <span className={`textarea-message textarea-message-${error ? 'error' : 'hint'}`}>
              {error || hint}
            </span>
          )}
        </div>
      );
    }
  )
);

Textarea.displayName = 'Textarea';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: InputSize;
  status?: InputStatus;
  label?: string;
  error?: string;
  className?: string;
  style?: CSSProperties;
}

export const Select = memo(
  forwardRef<HTMLDivElement, SelectProps>(
    (
      {
        options,
        value,
        defaultValue,
        onChange,
        placeholder = '请选择',
        disabled = false,
        size = 'md',
        status = 'default',
        label,
        error,
        className = '',
        style,
      },
      ref
    ) => {
      const [internalValue, setInternalValue] = useState(defaultValue ?? '');
      const [isOpen, setIsOpen] = useState(false);
      const currentValue = value ?? internalValue;
      const actualStatus = error ? 'error' : status;
      const selectedOption = options.find((opt) => opt.value === currentValue);

      const handleSelect = useCallback(
        (optionValue: string) => {
          setInternalValue(optionValue);
          onChange?.(optionValue);
          setIsOpen(false);
        },
        [onChange]
      );

      return (
        <div
          ref={ref}
          className={`select-wrapper select-${size} select-${actualStatus} ${disabled ? 'select-disabled' : ''} ${isOpen ? 'select-open' : ''} ${className}`}
          style={style}
        >
          {label && <label className="select-label">{label}</label>}
          <div
            className="select-trigger"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            role="combobox"
            aria-expanded={isOpen}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(!isOpen);
              }
            }}
          >
            <span className={`select-value ${!selectedOption ? 'select-placeholder' : ''}`}>
              {selectedOption?.label || placeholder}
            </span>
            <span className="select-arrow">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </span>
          </div>
          {isOpen && (
            <div className="select-dropdown">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={`select-option ${option.value === currentValue ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  role="option"
                  aria-selected={option.value === currentValue}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
          {error && <span className="select-error">{error}</span>}
        </div>
      );
    }
  )
);

Select.displayName = 'Select';

export default Input;
