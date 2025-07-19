import React from 'react';
import MemeSubmission from '../components/MemeSubmission';
import { Typography } from 'antd';

const { Title } = Typography;

const SubmitPage: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="arena-bg" />
      <div className="max-w-7xl mx-auto pt-32 px-4 pb-12 relative z-10">
        <Title
          level={2}
          className="text-4xl md:text-3xl font-black text-center mb-8 neon-text"
          style={{
            fontFamily: 'Orbitron, monospace',
            background: 'linear-gradient(135deg, #FF1493 0%, #8B5CF6 50%, #00FFFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          SUBMIT YOUR MEME
        </Title>
        <MemeSubmission />
      </div>
    </div>
  );
};

export default SubmitPage;