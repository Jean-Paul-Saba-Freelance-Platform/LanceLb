import React from 'react';
import { Outlet } from 'react-router-dom';
import Dither from '../../pages/Dither';
import './FreelancerLayout.css';

const FreelancerLayout = () => {
  return (
    <div className="freelancer-layout">
      <div className="layout-background">
        <Dither
          waveColor={[0.58, 0.3, 0.96]}
          disableAnimation={false}
          enableMouseInteraction={false}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.02}
        />
      </div>
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
};

export default FreelancerLayout;
