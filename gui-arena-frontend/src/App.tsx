import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { Network } from '@aptos-labs/ts-sdk';
// Import wallet adapters - using the correct approach for current Aptos wallet adapter
// Note: Individual wallet packages are not needed with the current wallet adapter version

// Components
import Navigation from './components/Navigation';
import ParticleBackground from './components/ParticleBackground';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import LeaderboardPage from './pages/LeaderboardPage';
import SubmitPage from './pages/SubmitPage';
import Homepage from './pages/Homepage';
import VotePage from './pages/VotePage';

// Hooks and Utils
import { useArenaSettings } from './hooks/useLocalStorage';
import useArenaEffects from './hooks/useArenaEffects';

// Styles
import './App.css';
import './styles/arena.css';

// Arena theme configuration
const arenaTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: '#8B5CF6', // Purple
    colorSuccess: '#10B981', // Green
    colorWarning: '#F59E0B', // Amber
    colorError: '#EF4444', // Red
    colorInfo: '#3B82F6', // Blue
    colorBgBase: '#111827', // Dark gray
    colorBgContainer: 'rgba(17, 24, 39, 0.8)', // Semi-transparent dark
    colorBorder: 'rgba(139, 92, 246, 0.3)', // Purple border
    colorText: '#FFFFFF', // White text
    colorTextSecondary: 'rgba(255, 255, 255, 0.7)', // Light gray text
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "'Inter', 'Open Sans', system-ui, sans-serif",
  },
  components: {
    Card: {
      colorBgContainer: 'rgba(17, 24, 39, 0.8)',
      colorBorder: 'rgba(139, 92, 246, 0.3)',
    },
    Button: {
      colorPrimary: '#8B5CF6',
      colorPrimaryHover: '#7C3AED',
      colorPrimaryActive: '#6D28D9',
      borderRadius: 8,
      fontWeight: 600,
    },
    Modal: {
      colorBgElevated: 'rgba(17, 24, 39, 0.95)',
      colorBorder: 'rgba(139, 92, 246, 0.3)',
    },
    Progress: {
      colorSuccess: '#10B981',
    },
    Notification: {
      colorBgElevated: 'rgba(17, 24, 39, 0.95)',
      colorBorder: 'rgba(139, 92, 246, 0.3)',
    },
    Typography: {
      colorText: '#FFFFFF',
      colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
    },
    Input: {
      colorBgContainer: 'rgba(31, 41, 55, 0.8)',
      colorBorder: 'rgba(139, 92, 246, 0.3)',
      colorText: '#FFFFFF',
    },
    Select: {
      colorBgContainer: 'rgba(31, 41, 55, 0.8)',
      colorBorder: 'rgba(139, 92, 246, 0.3)',
      colorText: '#FFFFFF',
    },
  },
};

// Wallet configuration - using the current Aptos wallet adapter approach
const walletConfig = {
  autoConnect: false, // Changed to false to prevent auto-connection issues
  dappConfig: {
    network: Network.TESTNET, // Change to Network.MAINNET for production
    aptosConnectDappId: process.env.REACT_APP_APTOS_CONNECT_DAPP_ID,
  },
};

const App: React.FC = () => {
  const [settings] = useArenaSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [memes, setMemes] = useState<any[]>([]);
  const { effects } = useArenaEffects({
    enableParticles: settings.enableParticles,
    enableSoundEffects: settings.enableSoundEffects,
    enableVibration: settings.enableVibration,
  });

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate loading time for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Load initial data
        await loadMemes();
        
        // Show welcome notification
        effects.battleStarted();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        effects.errorOccurred('Failed to initialize the arena. Please refresh and try again.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [effects]);

  // Load memes data
  const loadMemes = async () => {
    try {
      // This would typically fetch from your backend/blockchain
      // For now, we'll use mock data
      const mockMemes = [
        {
          id: 1,
          title: "Doge to the Moon",
          imageUrl: "/api/placeholder/400/400",
          votes: 156,
          creator: "0x1234567890abcdef1234567890abcdef12345678",
          ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
          transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          timestamp: Date.now() - 86400000, // 1 day ago
        },
        {
          id: 2,
          title: "Pepe the Warrior",
          imageUrl: "/api/placeholder/400/400",
          votes: 142,
          creator: "0xabcdef1234567890abcdef1234567890abcdef12",
          ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdH",
          transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          timestamp: Date.now() - 172800000, // 2 days ago
        },
        {
          id: 3,
          title: "Chad Wojak Arena",
          imageUrl: "/api/placeholder/400/400",
          votes: 98,
          creator: "0x9876543210fedcba9876543210fedcba98765432",
          ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdI",
          transactionHash: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
          timestamp: Date.now() - 259200000, // 3 days ago
        },
      ];
      
      setMemes(mockMemes);
    } catch (error) {
      console.error('Failed to load memes:', error);
      effects.errorOccurred('Failed to load memes from the arena.');
    }
  };

  // Handle wallet connection
  const handleWalletConnect = (address: string) => {
    effects.walletConnected(address);
  };

  // Handle wallet error
  const handleWalletError = (error: any) => {
    console.error("Wallet adapter error:", error);
    effects.errorOccurred(`Wallet error: ${error?.message || 'Unknown error'}`);
  };

  // Handle new meme submission
  const handleMemeSubmitted = (newMeme: any) => {
    setMemes(prev => [newMeme, ...prev]);
    effects.submissionSuccess(newMeme.title);
  };

  // Handle vote cast
  const handleVoteCast = (memeId: number) => {
    setMemes(prev => prev.map(meme => 
      meme.id === memeId 
        ? { ...meme, votes: meme.votes + 1 }
        : meme
    ));
    effects.voteSuccess();
    
    // Check for new champion
    const updatedMemes = memes.map(meme => 
      meme.id === memeId 
        ? { ...meme, votes: meme.votes + 1 }
        : meme
    );
    
    const sortedMemes = updatedMemes.sort((a, b) => b.votes - a.votes);
    const newChampion = sortedMemes[0];
    const previousChampion = memes.sort((a, b) => b.votes - a.votes)[0];
    
    if (newChampion.id !== previousChampion.id) {
      effects.championCrowned(newChampion.title);
    }
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        {settings.enableParticles && <ParticleBackground />}
        <LoadingSpinner 
          fullScreen 
          text="Initializing Battle Arena..." 
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AptosWalletAdapterProvider
        autoConnect={walletConfig.autoConnect}
        dappConfig={walletConfig.dappConfig}
        onError={handleWalletError}
      >
        <ConfigProvider theme={arenaTheme}>
          <Router>
            <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative">
              {/* Particle Background */}
              {settings.enableParticles && <ParticleBackground />}
              
              {/* Main Content */}
              <div className="relative z-10">
                {/* Navigation */}
                <Navigation />
                
                {/* Main Routes */}
                <main className="min-h-screen pt-16">
                  <Routes>
                    <Route 
                      path="/" 
                      element={<Homepage />} 
                    />
                    <Route 
                      path="/vote" 
                      element={<VotePage />} 
                    />
                    <Route 
                      path="/submit" 
                      element={<SubmitPage />} 
                    />
                    <Route 
                      path="/leaderboard" 
                      element={<LeaderboardPage />} 
                    />
                  </Routes>
                </main>
                
                {/* Footer */}
                <footer className="bg-gray-900/50 backdrop-blur-lg border-t border-purple-500/30 py-8 mt-16">
                  <div className="container mx-auto px-4 text-center">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                      <div className="text-gray-400">
                        <p className="text-sm">
                          © 2024 Meme Battle Arena. Powered by Aptos Blockchain.
                        </p>
                        <p className="text-xs mt-1">
                          Decentralized. Transparent. Unstoppable.
                        </p>
                      </div>
                                            
                      <div className="flex items-center space-x-6">
                        <a 
                          href="https://aptoslabs.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                        >
                          Built on Aptos
                        </a>
                        <a 
                          href="https://pinata.cloud" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                        >
                          IPFS by Pinata
                        </a>
                        <div className="text-gray-500 text-xs">
                          v1.0.0
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-700">
                      <div className="flex justify-center space-x-8 text-xs text-gray-500">
                        <span>🏆 {memes.length} Memes in Arena</span>
                        <span>⚡ {memes.reduce((sum, meme) => sum + meme.votes, 0)} Total Votes</span>
                        <span>👑 {memes.length > 0 ? memes.sort((a, b) => b.votes - a.votes)[0].title : 'No Champion'}</span>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          </Router>
        </ConfigProvider>
      </AptosWalletAdapterProvider>
    </ErrorBoundary>
  );
};

export default App;