import { useEffect, useState } from 'react';
import { useNotification } from '../components/NotificationSystem';

interface ArenaEffectsConfig {
  enableParticles?: boolean;
  enableSoundEffects?: boolean;
  enableVibration?: boolean;
}

export const useArenaEffects = (config: ArenaEffectsConfig = {}) => {
  const [isSupported, setIsSupported] = useState({
    vibration: 'vibrate' in navigator,
    audio: typeof Audio !== 'undefined',
    particles: true
  });

  const notification = useNotification();

  // Sound effects
  const playSound = (type: 'vote' | 'champion' | 'battle' | 'error') => {
    if (!config.enableSoundEffects || !isSupported.audio) return;

    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const createTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };

    switch (type) {
      case 'vote':
        createTone(800, 0.2);
        setTimeout(() => createTone(1000, 0.2), 100);
        break;
      case 'champion':
        createTone(523, 0.3); // C
        setTimeout(() => createTone(659, 0.3), 150); // E
        setTimeout(() => createTone(784, 0.3), 300); // G
        setTimeout(() => createTone(1047, 0.5), 450); // C
        break;
      case 'battle':
        createTone(440, 0.1, 'square');
        setTimeout(() => createTone(880, 0.1, 'square'), 50);
        break;
      case 'error':
        createTone(200, 0.5, 'sawtooth');
        break;
    }
  };

  // Haptic feedback
  const vibrate = (pattern: number | number[]) => {
    if (!config.enableVibration || !isSupported.vibration) return;
    navigator.vibrate(pattern);
  };

  // Arena-specific effects
  const effects = {
    voteSuccess: () => {
      playSound('vote');
      vibrate(100);
      notification.success({
        title: '🎯 Vote Registered!',
        message: 'Your vote has been recorded on the blockchain.',
        duration: 3
      });
    },

    championCrowned: (memeName: string) => {
      playSound('champion');
            vibrate([200, 100, 200, 100, 400]);
      notification.champion({
        title: '👑 NEW CHAMPION CROWNED!',
        message: `"${memeName}" has claimed the throne! Witness the new ruler of the arena.`,
        duration: 8
      });
    },

    battleStarted: () => {
      playSound('battle');
      vibrate([50, 50, 50]);
      notification.battle({
        title: '⚔️ BATTLE COMMENCED!',
        message: 'The arena is now live! Cast your votes and determine the champion.',
        duration: 6
      });
    },

    submissionSuccess: (memeName: string) => {
      playSound('vote');
      vibrate([100, 50, 100]);
      notification.success({
        title: '🚀 Meme Deployed!',
        message: `"${memeName}" has entered the arena and is ready for battle!`,
        duration: 5
      });
    },

    errorOccurred: (message: string) => {
      playSound('error');
      vibrate(300);
      notification.error({
        title: '⚠️ Arena Error',
        message: message,
        duration: 6
      });
    },

    milestoneReached: (milestone: string, value: number) => {
      playSound('champion');
      vibrate([100, 100, 100]);
      notification.info({
        title: `🎉 ${milestone} Milestone!`,
        message: `The arena has reached ${value} ${milestone.toLowerCase()}! The battle intensifies.`,
        duration: 5
      });
    },

    walletConnected: (address: string) => {
      playSound('vote');
      vibrate(100);
      notification.success({
        title: '🔗 Wallet Connected',
        message: `Welcome to the arena, warrior! Address: ${address.slice(0, 6)}...${address.slice(-4)}`,
        duration: 4
      });
    },

    transactionPending: () => {
      notification.info({
        title: '⏳ Transaction Pending',
        message: 'Your transaction is being processed on the blockchain. Please wait...',
        duration: 0 // Don't auto-close
      });
    },

    transactionConfirmed: (txHash: string) => {
      playSound('vote');
      vibrate(150);
      notification.success({
        title: '✅ Transaction Confirmed',
        message: `Transaction successful! Hash: ${txHash.slice(0, 10)}...`,
        duration: 5
      });
    }
  };

  return {
    effects,
    playSound,
    vibrate,
    isSupported
  };
};

export default useArenaEffects;