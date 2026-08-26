import React from 'react';

export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg width="160" height="32" viewBox="0 0 160 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      
      {/* Geometric Wrench Body */}
      <path 
        d="M20 6 C18 4 15 4 13 6 C11.5 7.5 11 9.5 11.5 11.5 L6 17 C5 18 5 19.5 6 20.5 C7 21.5 8.5 21.5 9.5 20.5 L15 15 C17 15.5 19 15 20.5 13.5 C22.5 11.5 22.5 8.5 20 6 Z" 
        stroke="#E8F3F7" 
        strokeWidth="1.5" 
        fill="#0D1922" 
      />
      
      {/* Verified Fix Checkmark inside the Wrench Head */}
      <path 
        d="M15 9 L16.5 10.5 L19 7.5" 
        stroke="#00E5FF" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Wordmark */}
      <text x="34" y="21" fill="#E8F3F7" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" fontSize="16" fontWeight="600" letterSpacing="0.5">
        what<tspan fill="#00E5FF">DA</tspan>fix
      </text>
    </svg>
  );
}
