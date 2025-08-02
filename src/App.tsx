// src/App.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { PageErrorFallback } from './components/ui/ErrorFallback';

export default function App() {
  // O estado que controla se a sidebar está aberta ou fechada
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen); // Inverte o valor atual (true -> false, false -> true)
  };

  return (
    <div>
      {/* Passamos a função 'toggleSidebar' para o Header */}
      <Header onMenuButtonClick={toggleSidebar} />
      <div style={{ display: 'flex' }}>
        {/* A Sidebar só aparece se 'isSidebarOpen' for verdadeiro */}
        {isSidebarOpen && <Sidebar />}
        <main style={{ flexGrow: 1, padding: '1.5rem' }}>
          <ErrorBoundary fallback={<PageErrorFallback />}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
