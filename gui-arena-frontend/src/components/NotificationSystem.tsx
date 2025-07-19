import React, { useEffect } from 'react';
import { notification } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CloseCircleOutlined,
  TrophyOutlined,
  FireOutlined
} from '@ant-design/icons';

interface NotificationConfig {
  type: 'success' | 'error' | 'info' | 'warning' | 'champion' | 'battle';
  title: string;
  message: string;
  duration?: number;
}

const NotificationSystem = {
  success: (config: Omit<NotificationConfig, 'type'>) => {
    notification.success({
      message: config.title,
      description: config.message,
      duration: config.duration || 4,
      icon: <CheckCircleOutlined style={{ color: '#10B981' }} />,
      style: {
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
      },
      className: 'arena-notification'
    });
  },

  error: (config: Omit<NotificationConfig, 'type'>) => {
    notification.error({
      message: config.title,
      description: config.message,
      duration: config.duration || 6,
      icon: <CloseCircleOutlined style={{ color: '#EF4444' }} />,
      style: {
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
      },
      className: 'arena-notification'
    });
  },

  info: (config: Omit<NotificationConfig, 'type'>) => {
    notification.info({
      message: config.title,
      description: config.message,
      duration: config.duration || 4,
      icon: <InfoCircleOutlined style={{ color: '#3B82F6' }} />,
      style: {
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
      },
      className: 'arena-notification'
    });
  },

  warning: (config: Omit<NotificationConfig, 'type'>) => {
    notification.warning({
      message: config.title,
      description: config.message,
      duration: config.duration || 5,
      icon: <ExclamationCircleOutlined style={{ color: '#F59E0B' }} />,
      style: {
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
      },
      className: 'arena-notification'
    });
  },

  champion: (config: Omit<NotificationConfig, 'type'>) => {
    notification.success({
      message: config.title,
      description: config.message,
      duration: config.duration || 8,
      icon: <TrophyOutlined style={{ color: '#FFD700' }} />,
      style: {
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1))',
        border: '2px solid rgba(255, 215, 0, 0.5)',
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
      },
      className: 'arena-notification champion-notification'
    });
  },

  battle: (config: Omit<NotificationConfig, 'type'>) => {
    notification.info({
      message: config.title,
      description: config.message,
      duration: config.duration || 6,
      icon: <FireOutlined style={{ color: '#FF6B35' }} />,
      style: {
        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 20, 147, 0.1))',
        border: '2px solid rgba(255, 107, 53, 0.5)',
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 30px rgba(255, 107, 53, 0.3)',
      },
      className: 'arena-notification battle-notification'
    });
  }
};

// Hook for easy notification usage
export const useNotification = () => {
  return NotificationSystem;
};

export default NotificationSystem;