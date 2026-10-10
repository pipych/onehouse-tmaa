import React from 'react';

export interface AppLogoProps extends React.SVGAttributes<SVGElement> {
  className?: string;
  size?: number;
}

/**
 * AppLogo - Official One ecosystem logo symbol (1:1 from OneDash / OneHouse)
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-6 h-6 text-[#c0ff00]',
  size,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <path d="M 49.89 17.21 A 7.60 7.60 0 1 1 64.68 20.68 L 61.38 34.78 A 6.20 6.20 0 0 0 67.41 42.40 L 81.90 42.40 A 7.60 7.60 0 1 1 81.90 57.60 L 60.94 57.60 A 6.20 6.20 0 0 0 54.90 62.38 L 50.11 82.79 A 7.60 7.60 0 1 1 35.32 79.32 L 38.62 65.22 A 6.20 6.20 0 0 0 32.59 57.60 L 18.10 57.60 A 7.60 7.60 0 1 1 18.10 42.40 L 39.06 42.40 A 6.20 6.20 0 0 0 45.10 37.62 Z" />
    </svg>
  );
};
