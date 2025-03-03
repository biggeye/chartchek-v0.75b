import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  maxWidth = 'max-w-xs'
}) => {
  const [visible, setVisible] = useState(false);

  const tooltipPosition = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      case 'top':
      default:
        return 'bottom-full mb-2';
    }
  };

  return (
    <div className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`absolute ${tooltipPosition()} ${maxWidth} bg-white shadow-lg text-sm text-gray-900 p-2 rounded-md border border-gray-200 z-50 overflow-auto max-h-[300px]`}>
          {typeof content === 'string' ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            content
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
