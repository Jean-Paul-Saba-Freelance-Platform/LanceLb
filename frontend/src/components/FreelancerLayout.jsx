import { Outlet } from 'react-router-dom';
import Grainient from './Grainient';
import { useTheme } from '../lib/useTheme';
import './FreelancerLayout.css';

const DARK_COLORS = { color1: '#00A884', color2: '#111B21', color3: '#202C33' };
const LIGHT_COLORS = { color1: '#00A884', color2: '#d4f0e8', color3: '#e8f5f0' };

const FreelancerLayout = () => {
  const theme = useTheme();
  const colors = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;

  return (
    <div className="freelancer-layout">
      <div className="layout-background">
        <Grainient
          color1={colors.color1}
          color2={colors.color2}
          color3={colors.color3}
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
};

export default FreelancerLayout;