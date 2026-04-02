/**
 * =============================================================================
 * Switch 开关组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { forwardRef, memo, type ButtonHTMLAttributes } from 'react';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Switch = memo(
  forwardRef<HTMLButtonElement, SwitchProps>(
    (
      {
        checked,
        defaultChecked = false,
        onChange,
        label,
        size = 'md',
        disabled = false,
        className = '',
        ...rest
      },
      ref
    ) => {
      const handleClick = () => {
        if (disabled) return;
        onChange?.(!checked);
      };

      return (
        <div className={`switch-wrapper ${className}`}>
          <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={checked ?? defaultChecked}
            disabled={disabled}
            className={`switch switch-${size} ${checked ?? defaultChecked ? 'on' : ''}`}
            onClick={handleClick}
            {...rest}
          >
            <span className="switch-thumb" />
          </button>
          {label && <span className="switch-label">{label}</span>}
        </div>
      );
    }
  )
);

Switch.displayName = 'Switch';

export default Switch;
