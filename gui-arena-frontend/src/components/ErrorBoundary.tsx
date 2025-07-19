import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Arena Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
          <div className="arena-card p-12 max-w-2xl mx-4">
            <Result
              status="error"
              title={
                <div className="text-white text-3xl font-bold mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
                  🚨 ARENA MALFUNCTION
                </div>
              }
              subTitle={
                <div className="space-y-4">
                  <div className="text-gray-300 text-lg">
                    The battle arena has encountered an unexpected error. 
                    Our engineers are working to restore full functionality.
                  </div>
                  {this.state.error && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mt-4">
                      <div className="text-red-400 font-mono text-sm">
                        Error: {this.state.error.message}
                      </div>
                    </div>
                  )}
                </div>
              }
              extra={
                <div className="flex space-x-4 justify-center">
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />}
                    onClick={this.handleReload}
                    className="arena-btn"
                  >
                    Reload Arena
                  </Button>
                  <Button 
                    icon={<HomeOutlined />}
                    onClick={this.handleHome}
                    className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                  >
                    Return Home
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;