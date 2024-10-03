import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar'; // Navbar mis à jour
import Footer from './Footer';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faBookReader } from '@fortawesome/free-solid-svg-icons';

const Accueil = () => {
  const [books, setBooks] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false); // Modal pour emprunter
  const [currentBook, setCurrentBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returnDate, setReturnDate] = useState(''); // Pour gérer la date de retour
  const userId = localStorage.getItem('userId'); // Récupérer l'ID de l'utilisateur

  useEffect(() => {
    fetchAllBooks(); // Récupérer tous les livres disponibles et non disponibles
  }, []);

  // Récupérer tous les livres
  const fetchAllBooks = async () => {
    try {
      const token = localStorage.getItem('accessToken'); // Récupérer le token d'authentification
      const response = await axios.get('http://127.0.0.1:8000/api/books/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(response.data.results); // Stocker les livres dans le state
      setLoading(false); // Arrêter le chargement une fois les données récupérées
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
      setError('Erreur lors de la récupération des livres. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  // Ouvrir le modal avec les détails du livre
  const openDetailModal = (book) => {
    setCurrentBook(book);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  // Ouvrir le modal pour emprunter le livre
  const openLoanModal = (book) => {
    setCurrentBook(book); // Préremplir avec le livre à emprunter
    setShowLoanModal(true);
  };

  const closeLoanModal = () => {
    setShowLoanModal(false);
  };

  // Gérer l'emprunt du livre
  const handleBorrow = async (e) => {
    e.preventDefault();
    
    if (!returnDate) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez sélectionner une date de retour.',
        position: 'top-end',
        timer: 1500,
        showConfirmButton: false,
        toast: true
      });
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
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
      return;
    }

    try {
      // Envoyer une requête API pour créer un nouvel emprunt
      const loanData = {
        book_id: currentBook.id,
        user_id: userId,  // Utiliser l'ID de l'utilisateur connecté
        loan_date: new Date().toISOString().split('T')[0],  // Date actuelle
        return_date: returnDate,  // Date de retour sélectionnée
      };

      await axios.post('http://127.0.0.1:8000/api/loans/', loanData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Rendre le livre indisponible
      await axios.patch(`http://127.0.0.1:8000/api/books/${currentBook.id}/`, {
        availability: false,
      }, {
        headers: { Authorization: `Bearer ${token}` }
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

      // Fermer le modal d'emprunt
      closeLoanModal();
      fetchAllBooks(); // Recharger la liste des livres pour refléter la disponibilité mise à jour

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
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Navbar mis à jour */}
      <Navbar />

      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-left text-green-600 mb-8">Tous les livres</h1>

        {/* Indicateur de chargement ou message d'erreur */}
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
                <div className="flex">
                  {/* Image sur la gauche */}
                  <img
                    src={book.cover_image || 'https://via.placeholder.com/150'}
                    alt={book.title}
                    className="h-56 w-40 object-cover rounded"
                  />

                  {/* Détails du livre sur la droite */}
                  <div className="ml-4 flex-1">
                    <h2 className="text-xl font-semibold text-green-600 truncate">{book.title}</h2>
                    <p className="truncate"><strong>Auteur:</strong> {book.author}</p>
                    <p className="truncate"><strong>Genre:</strong> {book.genre}</p>

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

                {/* Boutons Emprunter et Détails */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => openLoanModal(book)} // Ouvrir le modal d'emprunt
                    className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center space-x-2 ${
                      !book.availability ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!book.availability} // Désactiver si le livre n'est pas disponible
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
      </div>

      {/* Footer */}
      <Footer />

      {/* Modal des détails du livre */}
      {showDetailModal && currentBook && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
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

      {/* Modal d'emprunt */}
      {showLoanModal && currentBook && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-2xl mb-4 text-green-600">Emprunter le livre</h2>
            <form onSubmit={handleBorrow}>
              <div className="mb-4">
                <label className="block mb-2">Livre à emprunter</label>
                <input
                  type="text"
                  className="border border-green-500 p-2 w-full rounded"
                  value={currentBook.title}
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Date de retour</label>
                <input
                  type="date"
                  className="border border-green-500 p-2 w-full rounded"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full">
                Emprunter
              </button>
            </form>
            <button className="mt-4 text-red-500" onClick={closeLoanModal}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accueil;
