import React from 'react';
import { Outlet } from 'react-router-dom';
import Dither from '../../pages/Dither';
import './ClientLayout.css';

/**
 * Layout wrapper for client pages
 * Provides consistent background and styling
 */
const ClientLayout = () => {
  return (
    <div className="client-layout">
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

export default ClientLayout;
