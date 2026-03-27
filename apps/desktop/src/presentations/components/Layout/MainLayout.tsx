import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { PlayerBar } from '../PlayerBar';
import './MainLayout.scss';

const MainLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className={`main-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Header />
      <div className="layout-mid">
        <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        <main className="main-area">
          <Outlet />
        </main>
      </div>
      <PlayerBar />
    </div>
  );
};

export default MainLayout;
