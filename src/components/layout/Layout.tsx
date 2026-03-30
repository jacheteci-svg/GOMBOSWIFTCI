import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
      <BottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
    </div>
  );
};
