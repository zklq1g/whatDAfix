import React from 'react';

interface LogoProps {
  className?: string;
  showIconOnly?: boolean;
}

export function Logo({ className = "", showIconOnly = false }: LogoProps) {
  if (showIconOnly) {
    return (
      <img
        src="/icon.png"
        alt="whatDAfix"
        className={`h-7 w-7 object-contain rounded shrink-0 ${className}`}
      />
    );
  }

  return (
    <img
      src="/logo-dark.png"
      alt="whatDAfix"
      className={`h-7 w-auto max-h-8 object-contain shrink-0 ${className}`}
    />
  );
}
