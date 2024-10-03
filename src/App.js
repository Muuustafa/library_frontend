import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Accueil from './components/Accueil';
import UserManagement from './components/UserManagement';
import BookManagement from './components/BookManagement';
import LoanManagement from './components/LoanManagement';
import Login from './components/Login';
import Index from './components/Index';

// Fonction de protection des routes
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');

  return isAuthenticated ? children : <Navigate to="/login" />; // Redirige vers la page de connexion si non authentifié
};

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Page d'accueil avant connexion */}
          <Route path="/" element={<Index />} />

          {/* Page de connexion */}
          <Route path="/login" element={<Login />} />

          {/* Accès protégé à la page d'accueil */}
          <Route
            path="/accueil"
            element={
              <ProtectedRoute>
                <Accueil />
              </ProtectedRoute>
            }
          />

          {/* Accès protégé à la gestion des utilisateurs */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* Accès protégé à la gestion des livres */}
          <Route
            path="/books"
            element={
              <ProtectedRoute>
                <BookManagement />
              </ProtectedRoute>
            }
          />

          {/* Accès protégé à la gestion des emprunts */}
          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <LoanManagement />
              </ProtectedRoute>
            }
          />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
