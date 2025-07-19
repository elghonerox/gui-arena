import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'large', 
  text = 'Loading Arena...', 
  fullScreen = false 
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24 }} spin />;

  const content = (
    <div className="flex flex-col items-center space-y-4">
      <Spin indicator={antIcon} />
      <div className="text-center space-y-2">
        <div className="text-2xl font-bold text-white neon-text">
          {text}
        </div>
        <div className="text-gray-400">
          Connecting to the blockchain...
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
              <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center z-50">
        <div className="arena-card p-12">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
};

export default LoadingSpinner;