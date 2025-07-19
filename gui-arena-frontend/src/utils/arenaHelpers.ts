import { message } from 'antd';

// Utility functions for the arena
export const formatAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (!address) return 'Unknown';
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const calculateRank = (memes: any[], targetMeme: any): number => {
  const sorted = [...memes].sort((a, b) => b.votes - a.votes);
  return sorted.findIndex(meme => meme.id === targetMeme.id) + 1;
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const getTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    message.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
    return false;
  }
  
  if (file.size > maxSize) {
    message.error('Image file size must be less than 10MB');
    return false;
  }
  
  return true;
};

export const generateMemeId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    message.error('Failed to copy to clipboard');
    return false;
  }
};

export const downloadImage = (imageUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const shareContent = async (title: string, text: string, url: string): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  } else {
    // Fallback to copying URL
    return await copyToClipboard(url);
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const getRandomArenaQuote = (): string => {
  const quotes = [
    "Enter the arena, claim your destiny! 🏆",
    "Only the strongest memes survive! ⚔️",
    "Battle for digital immortality! 🚀",
    "Legends are born in the arena! 👑",
    "Your meme, your legacy! 🎯",
    "Rise to the top, warrior! ⚡",
    "The arena awaits your champion! 🔥",
    "Forge your path to victory! 🛡️",
    "Unleash your creative power! 💫",
    "Become the meme master! 🎮"
  ];
  
  return quotes[Math.floor(Math.random() * quotes.length)];
};

export const getArenaStats = (memes: any[]) => {
  const totalVotes = memes.reduce((sum, meme) => sum + meme.votes, 0);
  const averageVotes = memes.length > 0 ? Math.round(totalVotes / memes.length) : 0;
  const topMeme = memes.reduce((top, meme) => meme.votes > top.votes ? meme : top, { votes: 0 });
  const activeCompetitors = memes.filter(meme => meme.votes > 0).length;
  
  return {
    totalMemes: memes.length,
    totalVotes,
    averageVotes,
    topMeme,
        activeCompetitors,
    competitionLevel: totalVotes > 100 ? 'Intense' : totalVotes > 50 ? 'Moderate' : 'Warming Up'
  };
};

export const getMemeRarity = (votes: number): { rarity: string; color: string; icon: string } => {
  if (votes >= 100) return { rarity: 'Legendary', color: '#FFD700', icon: '👑' };
  if (votes >= 50) return { rarity: 'Epic', color: '#8B5CF6', icon: '⚡' };
  if (votes >= 25) return { rarity: 'Rare', color: '#3B82F6', icon: '💎' };
  if (votes >= 10) return { rarity: 'Uncommon', color: '#10B981', icon: '🌟' };
  return { rarity: 'Common', color: '#6B7280', icon: '🎯' };
};

export const calculateBattleScore = (meme: any, totalVotes: number): number => {
  const voteRatio = totalVotes > 0 ? meme.votes / totalVotes : 0;
  const timeBonus = 1; // Could be based on submission time
  const rarityMultiplier = getMemeRarity(meme.votes).rarity === 'Legendary' ? 1.5 : 1;
  
  return Math.round(voteRatio * 1000 * timeBonus * rarityMultiplier);
};

export const getNextMilestone = (currentVotes: number): { milestone: number; progress: number } => {
  const milestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
  const nextMilestone = milestones.find(m => m > currentVotes) || milestones[milestones.length - 1];
  const previousMilestone = milestones[milestones.indexOf(nextMilestone) - 1] || 0;
  
  const progress = ((currentVotes - previousMilestone) / (nextMilestone - previousMilestone)) * 100;
  
  return { milestone: nextMilestone, progress: Math.min(progress, 100) };
};

export const generateShareText = (meme: any, rank: number): string => {
  const rarity = getMemeRarity(meme.votes);
  return `🏆 Check out "${meme.title}" - currently ranked #${rank} in the Meme Battle Arena! ` +
         `This ${rarity.rarity.toLowerCase()} meme has ${meme.votes} battle points. ` +
         `Join the arena and vote for your champion! 🎮`;
};

export const formatBattleTime = (startTime: number): string => {
  const elapsed = Date.now() - startTime;
  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const isValidAptosAddress = (address: string): boolean => {
  // Basic Aptos address validation
  const aptosAddressRegex = /^0x[a-fA-F0-9]{64}$/;
  return aptosAddressRegex.test(address);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const getRandomColor = (): string => {
  const colors = [
    '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#EF4444',
    '#10B981', '#3B82F6', '#F97316', '#84CC16', '#A855F7'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const animateNumber = (
  start: number,
  end: number,
  duration: number,
  callback: (value: number) => void
): void => {
  const startTime = performance.now();
  const difference = end - start;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(start + difference * easeOutCubic);
    
    callback(currentValue);
    
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  
  requestAnimationFrame(step);
};

export const createConfetti = (): void => {
  // Simple confetti effect for celebrations
  const colors = ['#FFD700', '#FF6B35', '#8B5CF6', '#EC4899', '#10B981'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    confetti.style.animation = `confetti-fall ${2 + Math.random() * 3}s linear forwards`;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      document.body.removeChild(confetti);
    }, 5000);
  }
};

// Add CSS for confetti animation
const addConfettiStyles = (): void => {
  if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(-10px) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
};

// Initialize confetti styles
addConfettiStyles();

export default {
  formatAddress,
  formatNumber,
  calculateRank,
  calculatePercentage,
  getTimeAgo,
  validateImageFile,
  generateMemeId,
  copyToClipboard,
  downloadImage,
  shareContent,
  debounce,
  throttle,
  getRandomArenaQuote,
  getArenaStats,
  getMemeRarity,
  calculateBattleScore,
  getNextMilestone,
  generateShareText,
  formatBattleTime,
  isValidAptosAddress,
  truncateText,
  getRandomColor,
  animateNumber,
  createConfetti
};