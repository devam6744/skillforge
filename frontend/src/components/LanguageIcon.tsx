import React from 'react';

interface LanguageIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const LanguageIcon: React.FC<LanguageIconProps> = ({
  name,
  size = 18,
  className = '',
  style = {},
}) => {
  const norm = (name || '').trim().toLowerCase();

  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    verticalAlign: 'middle',
    flexShrink: 0,
    ...style,
  };

  // 1. PYTHON (Official dual-snake emblem)
  if (norm === 'python' || norm === 'py') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        className={className}
        style={baseStyle}
        aria-label="Python"
      >
        <path
          fill="#3776AB"
          d="M63.7 7.1c-14.8 0-23.7 6.4-23.7 18.7v13.7h24.2v3.4H30.4C14.7 42.9 5 52.8 5 68.3c0 15.2 12.9 24.3 27.6 24.3h8.3V80.2c0-9.2 8-16.7 17.2-16.7h23.7c7.4 0 13.5-6.2 13.5-13.7V25.8c0-12.3-9.5-18.7-21.6-18.7zm-9.3 7.8c2.9 0 5.3 2.4 5.3 5.3s-2.4 5.3-5.3 5.3-5.3-2.4-5.3-5.3 2.4-5.3 5.3-5.3z"
        />
        <path
          fill="#FFD438"
          d="M64.3 120.9c14.8 0 23.7-6.4 23.7-18.7V88.5H63.8v-3.4h33.8c15.7 0 25.4-9.9 25.4-25.4 0-15.2-12.9-24.3-27.6-24.3h-8.3v12.4c0 9.2-8 16.7-17.2 16.7H46.2c-7.4 0-13.5 6.2-13.5 13.7v24.1c0 12.2 9.5 18.7 21.6 18.7zm9.3-7.8c-2.9 0-5.3-2.4-5.3-5.3s2.4-5.3 5.3-5.3 5.3 2.4 5.3 5.3-2.4 5.3-5.3 5.3z"
        />
      </svg>
    );
  }

  // 2. JAVASCRIPT (Official yellow JS badge)
  if (norm === 'javascript' || norm === 'js') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        className={className}
        style={baseStyle}
        aria-label="JavaScript"
      >
        <rect width="128" height="128" rx="16" fill="#F7DF1E" />
        <path
          fill="#000000"
          d="M38.8 98.7c3.9 2.5 8.7 4.1 13.4 4.1 7.4 0 12.1-3.6 12.1-11.2V58.4H53.1v32.6c0 3.1-1.6 4.7-4.6 4.7-2.1 0-4.1-.7-5.7-1.8l-4 4.8zm39.7 1.4c6.2 2.7 12.5 4.3 18.8 4.3 13.5 0 20.7-6.5 20.7-16.1 0-9.2-5.4-13-15.2-16.8-5.1-2-7.5-3.8-7.5-7.2 0-3.2 2.7-5.3 7.5-5.3 4.4 0 8.7 1.5 11.9 3.6l3.9-7.9c-4.1-2.7-9.8-4.3-15.6-4.3-12.4 0-19.4 6.8-19.4 15.6 0 8.7 6.1 13.1 15.2 16.8 5.4 2.2 7.7 4.2 7.7 7.5 0 3.7-3.2 6.1-9.2 6.1-5.4 0-10.8-2.1-14.7-4.8l-4.1 8.5z"
        />
      </svg>
    );
  }

  // 3. JAVA (Official Java Coffee Cup & Steam)
  if (norm === 'java') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        className={className}
        style={baseStyle}
        aria-label="Java"
      >
        <path
          fill="#5382A1"
          d="M48.2 88.5c18.5 1.5 38.2-1.2 53.6-8.8 0 0-4.8 3.5-12.7 6.2-14.2 4.9-35.4 6.2-51.4 3.1 0 0 3.3-.3 10.5-.5z"
        />
        <path
          fill="#E76F00"
          d="M41.7 69.2c19.8 1.4 43.1-1.3 58.7-9.5 0 0-5.3 3.9-14 6.9-15.6 5.5-38.9 6.8-56.5 3.3 0 0 3.6-.3 11.8-.7z"
        />
        <path
          fill="#5382A1"
          d="M87.4 97.5c-20.9 8.1-55.7 8.5-73.4.7-2.1-.9-3.7-2.4-1.2-3.3 7.8-2.9 17.6-4.3 27-4.4-6.4-3.1-15.1-1.9-20.7.6-3.8 1.7-4.9 3.5-2.7 5.2 6.5 5.1 27.6 8.3 50.1 7.6 10.7-.3 20.9-2.1 20.9-6.4z"
        />
        <path
          fill="#E76F00"
          d="M74.9 37.1c6.5 7.4 3.7 13.9-3.2 21.1-6.1 6.3-9.5 11.5-3.8 18.2 1.3 1.5 2.8 2.8 4.2 4.1-3.6-.6-7.3-2-10.2-4.4-7.5-6.2-7.3-13.8-.4-20.9 7-7.2 10.3-12.2 4.5-18.7-1.1-1.3-2.6-2.5-3.9-3.7 3.3.6 6.8 1.9 9.8 4.3z"
        />
        <path
          fill="#5382A1"
          d="M62.6 12.3c4.8 5.5 2.7 10.3-2.4 15.6-4.5 4.7-7 8.5-2.8 13.5.9 1.1 2 2.1 3.1 3-2.7-.4-5.4-1.5-7.5-3.2-5.5-4.6-5.4-10.2-.3-15.5 5.2-5.3 7.6-9 3.3-13.8-.8-.9-1.9-1.8-2.9-2.7 2.5.4 5 1.4 7.2 3.1z"
        />
        <path
          fill="#E76F00"
          d="M93.5 110.1c-25.1 6.5-67.6 6.7-89.8-.5-3.6-1.2-1.9-3.3.8-4.2 12.9-4.2 31.8-6.1 48.6-5.5 22.8.8 42.1 4.7 40.4 10.2z"
        />
      </svg>
    );
  }

  // 4. C++ (Official ISO C++ Hexagonal Shield)
  if (norm === 'c++' || norm === 'cpp') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        className={className}
        style={baseStyle}
        aria-label="C++"
      >
        <path
          fill="#00599C"
          d="M64 4.5l55.4 32v64L64 123.5l-55.4-32v-64L64 4.5z"
        />
        <path
          fill="#004482"
          d="M64 12.5l48.5 28v56L64 115.5l-48.5-28v-56L64 12.5z"
        />
        {/* Bold C */}
        <path
          fill="#FFFFFF"
          d="M57.8 42.3c-4.8-3.4-10.7-5.2-16.7-5.2-17.6 0-30.8 12.9-30.8 29.9s13.2 29.9 30.8 29.9c6.4 0 12.5-2 17.4-5.6l-4.7-10.8c-3.6 2.6-7.8 4.1-12.7 4.1-11.2 0-19.1-8.1-19.1-17.6s7.9-17.6 19.1-17.6c4.6 0 8.7 1.4 12.2 3.9l4.5-11z"
        />
        {/* Plus 1 */}
        <path
          fill="#659AD2"
          d="M74.5 58.5h4.6v-7.2h5.5v7.2h7.2v5.5h-7.2v7.2h-5.5v-7.2h-4.6v-5.5z"
        />
        {/* Plus 2 */}
        <path
          fill="#659AD2"
          d="M96.5 58.5h4.6v-7.2h5.5v7.2h7.2v5.5h-7.2v7.2h-5.5v-7.2h-4.6v-5.5z"
        />
      </svg>
    );
  }

  // 5. C (Official C Hexagonal Shield)
  if (norm === 'c') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        className={className}
        style={baseStyle}
        aria-label="C"
      >
        <path
          fill="#A8B9CC"
          d="M64 4.5l55.4 32v64L64 123.5l-55.4-32v-64L64 4.5z"
        />
        <path
          fill="#283593"
          d="M64 12.5l48.5 28v56L64 115.5l-48.5-28v-56L64 12.5z"
        />
        <path
          fill="#FFFFFF"
          d="M83.2 40.5c-6.8-4.8-15.3-7.4-23.9-7.4-25.2 0-44.1 18.5-44.1 42.9s18.9 42.9 44.1 42.9c9.1 0 17.9-2.8 24.9-8.1l-6.8-15.5c-5.2 3.7-11.2 5.9-18.1 5.9-16 0-27.3-11.6-27.3-25.2s11.3-25.2 27.3-25.2c6.6 0 12.5 2 17.5 5.6l6.4-15.9z"
        />
      </svg>
    );
  }

  // Fallback icon for any generic track
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={baseStyle}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
};

export default LanguageIcon;

