import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faBookReader } from '@fortawesome/free-solid-svg-icons';

const Index = () => {
  const [books, setBooks] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentBook, setCurrentBook] = useState(null); // Current book for modal
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [error, setError] = useState(null); // Error handling for API calls
  const navigate = useNavigate();

  // Vérifier l'authentification et récupérer les livres au chargement
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      validateToken(token);
    }
    fetchLastBooks();
  }, []);

  // Valider le token pour vérifier s'il est toujours valide
  const validateToken = async (token) => {
    try {
      await axios.get('http://127.0.0.1:8000/api/auth/validate-token/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token invalide ou expiré:', error);
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false);
    }
  };

  const fetchLastBooks = async () => {
    setLoading(true);
    try {
      // Fetch all books
      const response = await axios.get('http://127.0.0.1:8000/api/books/');
      
      // Filter books to get only available ones, then sort by id (descending)
      const availableBooks = response.data.results
        .filter(book => book.availability) // Keep only available books
        .sort((a, b) => b.id - a.id) // Sort by ID in descending order

      // Select only the last 6 books
      const lastSixAvailableBooks = availableBooks.slice(0, 6);

      setBooks(lastSixAvailableBooks);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
      setError('Erreur lors de la récupération des livres. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Open the modal with book details
  const openDetailModal = (book) => {
    setCurrentBook(book);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  // Handle borrow book action (requires login)
  const handleBorrow = async (bookId) => {
    if (!isAuthenticated) {
      Swal.fire({
        position: 'top-end',
        icon: 'warning',
        title: 'Veuillez vous connecter pour emprunter un livre.',
        showConfirmButton: false,
        timer: 1500,
        background: '#e6fffa',
        toast: true,
        color: '#2d2a2a',
      });
      navigate('/login');
    } else {
      try {
        await axios.post(`http://127.0.0.1:8000/api/books/${bookId}/borrow/`, null, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Emprunt réussi !',
          text: 'Le livre a été ajouté à vos emprunts.',
          showConfirmButton: false,
          timer: 1500,
          background: '#e6fffa',
          toast: true,
          color: '#2d2a2a',
        });
      } catch (error) {
        console.error('Erreur lors de l\'emprunt du livre :', error);
        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: 'Erreur lors de l\'emprunt.',
          text: 'Veuillez réessayer plus tard.',
          showConfirmButton: false,
          timer: 1500,
          background: '#e6fffa',
          toast: true,
          color: '#2d2a2a',
        });
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    Swal.fire('Déconnexion réussie', '', 'success');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Navbar */}
      <nav className="bg-green-600 p-4">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="text-white text-xl font-bold">
            <span>Gestion de la Bibliothèque</span>
          </div>

          {/* Bouton de connexion ou déconnexion */}
          {!isAuthenticated ? (
            <button
              onClick={() => navigate('/login')}
              className="text-white bg-green-700 px-4 py-2 rounded hover:bg-green-800"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="text-white bg-red-500 px-4 py-2 rounded hover:bg-red-600"
            >
              Déconnexion
            </button>
          )}
        </div>
      </nav>

      <div className="container mx-auto py-8">
        {/* Title aligned to the left */}
        <h1 className="text-3xl font-bold text-left text-green-600 mb-8">Les derniers livres disponibles</h1>

        {/* Affichage du chargement ou des erreurs */}
        {loading ? (
          <p>Chargement des livres...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg shadow-lg p-4 w-95 transition-transform transform hover:scale-105 hover:shadow-xl flex flex-col justify-between"
              >
                {/* Flex container to align image and book details */}
                <div className="flex">
                  {/* Vertical image on the left */}
                  <img
                    src={book.cover_image || 'https://via.placeholder.com/150'}
                    alt={book.title}
                    className="h-56 w-44 object-cover rounded" // Image width updated to w-44
                  />

                  {/* Book details on the right */}
                  <div className="ml-4 flex-1">
                    <h2 className="text-xl font-semibold text-green-600 truncate">{book.title}</h2>
                    <p className="truncate"><strong>Auteur:</strong> {book.author}</p>
                    <p className="truncate"><strong>Genre:</strong> {book.genre}</p>

                    {/* Display availability in green or red */}
                    {/* Disponibilité */}
                    <p>
                      {' '}
                      <span
                        className={`px-2 py-1 rounded-lg font-bold ${
                          book.availability
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {book.availability ? 'Disponible' : 'Indisponible'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Borrow and details buttons */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleBorrow(book.id)} // Pass the book ID to handleBorrow
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center space-x-2"
                  >
                    <FontAwesomeIcon icon={faBookReader} />
                    <span>Emprunter</span>
                  </button>

                  <button
                    onClick={() => openDetailModal(book)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span>Détails</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Button for more books */}
        <div className="mt-8 text-center">
          {!isAuthenticated ? (
            <button
              onClick={() => navigate('/login')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Voir plus de livres (connexion requise)
            </button>
          ) : (
            <button
              onClick={() => navigate('/books')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Voir plus de livres
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Modal for book details */}
      {showDetailModal && currentBook && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg md:w-2/3"> {/* Updated modal width */}
            <h2 className="text-2xl mb-4 text-green-600">Détails du livre</h2>

            <div className="flex">
              <div className="h-80 w-1/2 rounded overflow-hidden mb-4">
                {currentBook.cover_image ? (
                  <img
                    src={currentBook.cover_image}
                    alt={currentBook.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200 rounded">
                    <span className="text-gray-500">Pas d'image de couverture</span>
                  </div>
                )}
              </div>

              <div className="w-2/3 pl-6">
                <p><strong>Titre:</strong> {currentBook.title}</p>
                <p><strong>Auteur:</strong> {currentBook.author}</p>
                <p><strong>Genre:</strong> {currentBook.genre}</p>
                <p><strong>Date de publication:</strong> {currentBook.publication_date}</p>
                <p>
                  {' '}
                  <span
                    className={`px-2 py-1 rounded-lg font-bold ${
                      currentBook.availability
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {currentBook.availability ? 'Disponible' : 'Indisponible'}
                  </span>
                </p>

              </div>
            </div>

            <button className="mt-4 text-red-500" onClick={closeDetailModal}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
