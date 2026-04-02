/**
 * =============================================================================
 * Checkbox 复选框组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { forwardRef, memo, type InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  indeterminate?: boolean;
}

export const Checkbox = memo(
  forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, indeterminate = false, disabled = false, className = '', ...rest }, ref) => {
      return (
        <label className={`checkbox-wrapper ${disabled ? 'disabled' : ''} ${className}`}>
          <input
            ref={ref}
            type="checkbox"
            className="checkbox-input"
            disabled={disabled}
            aria-checked={indeterminate ? 'mixed' : rest.checked}
            {...rest}
          />
          <span className="checkbox-box">
            {rest.checked && (
              <svg className="checkbox-check" viewBox="0 0 24 24" width="12" height="12">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
            {indeterminate && !rest.checked && (
              <svg className="checkbox-check" viewBox="0 0 24 24" width="12" height="12">
                <path fill="currentColor" d="M19 13H5v-2h14v2z" />
              </svg>
            )}
          </span>
          {label && <span className="checkbox-label">{label}</span>}
        </label>
      );
    }
  )
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
