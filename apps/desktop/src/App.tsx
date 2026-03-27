import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PlaylistDetailPage } from './presentations/pages/PlaylistDetailPage';
import { MainLayout } from './presentations/components/Layout';
import './App.scss';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/playlist/0" replace />} />
            <Route path="playlist/:id" element={<PlaylistDetailPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
