import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingIndicator = ({
  message = 'Loading data...',
  description,
  fullHeight = false,
  size = 'default', // 'small', 'default', 'large'
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${
        fullHeight ? 'min-h-[400px]' : ''
      }`}
    >
      <Loader2
        className={`${sizeClasses[size] || sizeClasses.default} animate-spin text-cyan-400`}
      />
      <p className="mt-3 text-sm font-medium text-slate-200">{message}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-400 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
};

export default LoadingIndicator;
