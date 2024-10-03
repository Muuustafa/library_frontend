import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    profile_image: null,
  });
  const [registerError, setRegisterError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fonction pour afficher une notification SweetAlert
  const showSuccessAlert = (message) => {
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 1500,
      background: '#e6fffa',
      color: '#2d2a2a',
      toast: true,
    });
  };

  // Fonction pour récupérer les informations de l'utilisateur après connexion
  const fetchUserProfile = async (token) => {
    try {
      // Décoder le token JWT pour obtenir l'ID de l'utilisateur
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.user_id;

      // Stocker l'ID de l'utilisateur dans le localStorage
      localStorage.setItem('userId', userId);
      console.log("User ID récupéré: ", userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/accueil'); // Redirection vers la page d'accueil si l'utilisateur est authentifié
    }
  }, [isAuthenticated, navigate]);

  // Connexion de l'utilisateur
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/token/', {
        username,
        password,
      });
      const { access, refresh } = response.data;

      // Stocker les tokens dans le localStorage
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      // Récupérer les informations de l'utilisateur connecté en utilisant le token
      await fetchUserProfile(access);

      showSuccessAlert('Connexion réussie !');
      setIsAuthenticated(true);
    } catch (error) {
      if (error.response && error.response.data) {
        setLoginError('Échec de la connexion, vérifiez vos identifiants.');
      } else {
        setLoginError('Erreur du serveur, veuillez réessayer plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Gestion de l'inscription
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('username', newUser.username);
    formData.append('first_name', newUser.first_name);
    formData.append('last_name', newUser.last_name);
    formData.append('email', newUser.email);
    formData.append('password', newUser.password);
    if (newUser.profile_image) {
      formData.append('profile_image', newUser.profile_image);
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/users/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessAlert('Inscription réussie !');
      setShowRegisterModal(false);
      setNewUser({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        profile_image: null,
      });
    } catch (error) {
      if (error.response && error.response.data) {
        const errors = Object.values(error.response.data).flat();
        setRegisterError(errors.join(' '));
      } else {
        setRegisterError('Échec de l\'inscription. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer le changement de fichier pour l'image de profil
  const handleProfileImageChange = (e) => {
    setNewUser({ ...newUser, profile_image: e.target.files[0] });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url("/images/Libary.jpg")` }}>
      <div className="w-full max-w-md bg-white bg-opacity-80 p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-8 text-center text-green-600">Connexion</h1>

        {loginError && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {loginError}
          </div>
        )}

        <form onSubmit={handleLogin} className="bg-transparent">
          <div className="mb-6">
            <label className="block mb-2 font-bold text-green-600">Nom d'utilisateur</label>
            <input
              type="text"
              className="border border-green-500 p-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-bold text-green-600">Mot de passe</label>
            <input
              type="password"
              className="border border-green-500 p-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="bg-green-500 text-white py-2 px-4 w-full rounded hover:bg-green-600" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p>Pas encore de compte ? <span className="text-green-600 cursor-pointer" onClick={() => setShowRegisterModal(true)}>Créer un compte</span></p>
        </div>

        {/* Modal d'inscription */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
              <h2 className="text-2xl mb-4 text-green-600">Inscription</h2>

              {registerError && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div className="mb-4">
                  <label className="block mb-2">Nom d'utilisateur</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Prénom</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Nom de famille</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Email</label>
                  <input
                    type="email"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Mot de passe</label>
                  <input
                    type="password"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Image de profil</label>
                  <input
                    type="file"
                    className="border border-green-500 p-2 w-full rounded"
                    onChange={handleProfileImageChange}
                  />
                </div>
                <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded w-full hover:bg-green-600" disabled={loading}>
                  {loading ? 'Inscription...' : 'S\'inscrire'}
                </button>
              </form>
              <button className="mt-4 text-red-500" onClick={() => setShowRegisterModal(false)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
