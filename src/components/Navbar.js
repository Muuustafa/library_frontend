import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // Supprimer le token
    navigate('/'); // Rediriger vers la page de connexion
  };

  return (
    <nav className="bg-green-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-white text-xl font-bold">
          <span onClick={() => navigate('/accueil')}>Gestion de la Bibliothèque</span>
        </div>

        {/* Liens de navigation si authentifié */}
        {isAuthenticated && (
          <div className="space-x-4">
            <span onClick={() => navigate('/users')} className="text-white cursor-pointer hover:underline">Utilisateurs</span>
            <span onClick={() => navigate('/books')} className="text-white cursor-pointer hover:underline">Livres</span>
            <span onClick={() => navigate('/loans')} className="text-white cursor-pointer hover:underline">Emprunts</span>
          </div>
        )}

        {/* Bouton de déconnexion ou connexion */}
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="text-white bg-red-500 px-4 py-2 rounded hover:bg-red-600"
          >
            Déconnexion
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="text-white bg-green-500 px-4 py-2 rounded hover:bg-green-600"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
