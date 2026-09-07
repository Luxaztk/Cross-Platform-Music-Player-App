import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PlaylistDetailPage } from './presentations/pages/PlaylistDetailPage';
import { MainLayout, GlobalDragDrop } from '@components';
import './App.scss';

const SettingsPage = React.lazy(() =>
  import('./presentations/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

function App() {
  return (
    <Router>
      <div className="app-container">
        <GlobalDragDrop />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/playlist/0" replace />} />
            <Route path="playlist/:id" element={<PlaylistDetailPage />} />
            <Route
              path="settingsPage"
              element={
                <Suspense fallback={null}>
                  <SettingsPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
