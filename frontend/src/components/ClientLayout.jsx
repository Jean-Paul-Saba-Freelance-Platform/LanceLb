import React from 'react';
import { Outlet } from 'react-router-dom';
import Grainient from './Grainient';
import './ClientLayout.css';

const ClientLayout = () => {
  return (
    <div className="client-layout">
      <div className="layout-background">
        <Grainient
          color1="#FF9FFC"
          color2="#5227FF"
          color3="#B19EEF"
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

export default ClientLayout;
