import React from 'react';

const Button = ({
  label,
  variant = 'primary',
  size = 'medium',
  stateProp = 'default',
  className = '',
  divClassName = '',
  iconClassName = '',
  showIcon = false,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-Primarycolor text-Secondarycolor hover:bg-[#1a1a1a]',
    secondary:
      'bg-Secondarycolor text-Primarycolor hover:bg-[#f0f0f0]',
    tertiary:
      'bg-transparent text-Primarycolor border border-border hover:border-Primarycolor',
  };

  const sizeStyles = {
    small: 'h-9 px-5 text-xs tracking-[0.06em]',
    medium: 'h-11 px-7 text-[0.8125rem] tracking-[0.05em]',
    large: 'h-[3.25rem] px-9 text-sm tracking-[0.04em]',
  };

  const baseStyles = [
    'inline-flex items-center justify-center',
    'font-display font-medium',
    'transition-all duration-500',
    'active:scale-[0.98] active:translate-y-[1px]',
    'focus-visible:outline-2 focus-visible:outline-Primarycolor focus-visible:outline-offset-2',
    'cursor-pointer select-none whitespace-nowrap',
    'relative overflow-hidden',
  ].join(' ');

  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`w-4 h-4 ml-2 ${iconClassName}`}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
      />
    </svg>
  );

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      {...props}
    >
      <span
        className={`flex items-center justify-center leading-none ${divClassName}`}
      >
        {label}
        {showIcon && icon}
      </span>
    </button>
  );
};

export default Button;
