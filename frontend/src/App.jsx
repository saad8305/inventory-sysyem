import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage onLoginSuccess={setToken} />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
            } 
          />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
export default App;