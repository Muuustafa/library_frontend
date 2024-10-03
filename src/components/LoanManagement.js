import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlusCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Navbar from './Navbar';
import Footer from './Footer';

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]); // Seuls les livres disponibles
  const userId = localStorage.getItem('userId');
  const [currentPageUrl, setCurrentPageUrl] = useState('http://127.0.0.1:8000/api/loans/');
  const [pagination, setPagination] = useState({ next: null, previous: null });
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // Modal de détails
  const [currentLoan, setCurrentLoan] = useState({
    book_id: '',
    return_date: '',
  });
  const [originalBookId, setOriginalBookId] = useState(null); // Stocker l'ID du livre d'origine lors de l'édition
  const [selectedLoan, setSelectedLoan] = useState(null); // Stocker l'emprunt sélectionné pour les détails
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');

  useEffect(() => {
    fetchLoans();
    fetchAvailableBooks();
  }, [currentPageUrl, searchQuery, searchDate]);

  // Récupérer tous les emprunts avec filtrage en temps réel
  const fetchLoans = async () => {
    try {
      const response = await axios.get(currentPageUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        params: {
          book_title: searchQuery || undefined,
          return_date: searchDate || undefined,
        },
      });
      setLoans(response.data.results);
      setPagination({ next: response.data.next, previous: response.data.previous });
    } catch (error) {
      console.error('Erreur lors de la récupération des emprunts:', error);
    }
  };

  // Récupérer tous les livres (front-end filtrera la disponibilité)
  const fetchAvailableBooks = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/books/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      // Filtrer uniquement les livres disponibles sur le front-end
      const availableBooks = response.data.results.filter(book => book.availability === true);
      setBooks(availableBooks);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
    }
  };

  // Ouvrir le modal d'emprunt
  const openModal = (loan = null) => {
    setIsEditing(!!loan);
    if (loan) {
      // Si on édite, stocker le livre d'origine et préremplir les champs
      setCurrentLoan({ book_id: loan.book.id.toString(), return_date: loan.return_date });
      setOriginalBookId(loan.book.id); // Stocker l'ID du livre d'origine
    } else {
      setCurrentLoan({ book_id: '', return_date: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Ouvrir le modal de détails
  const openDetailModal = (loan) => {
    setSelectedLoan(loan);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  // Afficher une notification toast
  const showToast = (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      background: '#28a745',  // Couleur verte pour le succès
      color: 'white',
      iconColor: 'white',
    });
  };

  // Soumettre l'emprunt (ajouter ou modifier)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      Swal.fire('Erreur', 'Utilisateur non identifié. Veuillez vous reconnecter.', 'error');
      return;
    }

    // Vérification des données obligatoires
    if (!currentLoan.book_id || !currentLoan.return_date) {
      Swal.fire('Erreur', 'Veuillez sélectionner un livre et une date de retour.', 'error');
      return;
    }

    const selectedBook = books.find((book) => book.id === parseInt(currentLoan.book_id));
    if (!selectedBook || !selectedBook.availability) {
      Swal.fire('Erreur', 'Ce livre est actuellement indisponible.', 'error');
      return;
    }

    const loanData = {
      book_id: currentLoan.book_id,
      user_id: userId,
      loan_date: new Date().toISOString().split('T')[0],
      return_date: currentLoan.return_date,
    };

    try {
      if (isEditing) {
        // Si un autre livre est sélectionné, mettre à jour la disponibilité
        if (originalBookId !== parseInt(currentLoan.book_id)) {
          // Rendre l'ancien livre disponible
          await axios.patch(`http://127.0.0.1:8000/api/books/${originalBookId}/`, {
            availability: true,
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });

          // Rendre le nouveau livre indisponible
          await axios.patch(`http://127.0.0.1:8000/api/books/${currentLoan.book_id}/`, {
            availability: false,
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
        }

        // Modifier l'emprunt
        await axios.put(`http://127.0.0.1:8000/api/loans/${currentLoan.id}/`, loanData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        showToast('Emprunt modifié avec succès');
      } else {
        // Ajouter un nouvel emprunt
        await axios.post('http://127.0.0.1:8000/api/loans/', loanData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        // Mettre à jour la disponibilité du livre emprunté
        await axios.patch(`http://127.0.0.1:8000/api/books/${currentLoan.book_id}/`, {
          availability: false,
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        showToast('Emprunt ajouté avec succès');
      }
      closeModal();
      fetchLoans();
      fetchAvailableBooks();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'emprunt :', error.response?.data);
      Swal.fire('Erreur', `Une erreur est survenue lors de la sauvegarde. ${error.response?.data?.message || ''}`, 'error');
    }
  };

  // Supprimer un emprunt
  const handleDelete = async (id, bookId) => {
    Swal.fire({
      title: 'Êtes-vous sûr de vouloir supprimer cet emprunt ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#24d80a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Suppression de l'emprunt
          await axios.delete(`http://127.0.0.1:8000/api/loans/${id}/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });

          // Mise à jour de la disponibilité du livre à true (disponible à nouveau)
          await axios.patch(`http://127.0.0.1:8000/api/books/${bookId}/`, {
            availability: true,
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });

          // Rafraîchir les listes des emprunts et livres
          fetchLoans();
          fetchAvailableBooks();

          showToast('Emprunt supprimé avec succès');
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'emprunt:', error);
          Swal.fire('Erreur', 'Une erreur est survenue lors de la suppression.', 'error');
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-8">Gestion des emprunts</h1>

        <div className="mb-4 flex justify-between">
          {/* Champs de recherche à gauche */}
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Rechercher par livre"
              className="border border-green-500 p-2 rounded"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Recherche en temps réel
            />
            <input
              type="date"
              placeholder="Rechercher par date de retour"
              className="border border-green-500 p-2 rounded"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)} // Recherche en temps réel
            />
          </div>

          {/* Bouton d'ajout d'emprunt à droite */}
          <button
            onClick={() => openModal()}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
            Ajouter un emprunt
          </button>
        </div>

        {loans.length > 0 ? (
          <table className="min-w-full bg-white rounded shadow-md overflow-hidden">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="py-4 px-4 text-center">Titre du livre</th>
                <th className="py-4 px-4 text-center">Emprunté par</th>
                <th className="py-4 px-4 text-center">Date d'emprunt</th>
                <th className="py-4 px-4 text-center">Date de retour</th>
                <th className="py-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr
                  key={loan.id}
                  className="border-b hover:bg-gray-100 transition-colors duration-200"
                >
                  <td className="py-4 px-4 text-center">{loan.book.title}</td>
                  <td className="py-4 px-4 text-center">
                    {loan.user.first_name} {loan.user.last_name}
                  </td>
                  <td className="py-4 px-4 text-center">{loan.loan_date}</td>
                  <td className="py-4 px-4 text-center">{loan.return_date}</td>
                  <td className="py-4 px-4 text-center flex justify-center space-x-4">
                    <button
                      onClick={() => openModal(loan)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleDelete(loan.id, loan.book.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <button
                      onClick={() => openDetailModal(loan)}
                      className="text-green-500 hover:text-green-700"
                    >
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500">Aucun emprunt disponible</p>
        )}

        {/* Pagination */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setCurrentPageUrl(pagination.previous)}
            className={`px-4 py-2 bg-white border border-green-500 rounded ${!pagination.previous ? 'text-gray-400' : 'text-green-500'}`}
            disabled={!pagination.previous}
          >
            Précédent
          </button>
          <button
            onClick={() => setCurrentPageUrl(pagination.next)}
            className={`px-4 py-2 bg-white border border-green-500 rounded ${!pagination.next ? 'text-gray-400' : 'text-green-500'}`}
            disabled={!pagination.next}
          >
            Suivant
          </button>
        </div>

        {/* Modal Add/Edit Loan */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
              <h2 className="text-2xl mb-4 text-green-600">{isEditing ? 'Modifier Emprunt' : 'Ajouter Emprunt'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-2">Livre à emprunter</label>
                  <select
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentLoan.book_id}
                    onChange={(e) => setCurrentLoan({ ...currentLoan, book_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionnez un livre</option>
                    {books.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Date de retour</label>
                  <input
                    type="date"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentLoan.return_date}
                    onChange={(e) => setCurrentLoan({ ...currentLoan, return_date: e.target.value })} 
                    required
                  />
                </div>
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full">
                  {isEditing ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </form>
              <button className="mt-4 text-red-500" onClick={closeModal}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Modal de Détails */}
        {showDetailModal && selectedLoan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg md:w-2/3">
              <h2 className="text-2xl mb-4 text-green-600">Détails de l'emprunt</h2>

              <div className="flex">
                {/* Image de couverture du livre */}
                <div className="h-80 w-1/2 rounded overflow-hidden mb-4">
                  {selectedLoan.book.cover_image ? (
                    <img
                      src={selectedLoan.book.cover_image}
                      alt={selectedLoan.book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-200 rounded">
                      <span className="text-gray-500">Pas d'image de couverture</span>
                    </div>
                  )}
                </div>

                {/* Détails de l'emprunt */}
                <div className="w-2/3 pl-6">
                  <p className="mb-2"><strong>Titre du livre:</strong> {selectedLoan.book.title}</p>
                  <p className="mb-2"><strong>Emprunté par:</strong> {selectedLoan.user.first_name} {selectedLoan.user.last_name}</p>
                  <p className="mb-2"><strong>Date d'emprunt:</strong> {selectedLoan.loan_date}</p>
                  <p className="mb-2"><strong>Date de retour:</strong> {selectedLoan.return_date}</p>
                </div>
              </div>

              {/* Bouton de fermeture */}
              <button className="mt-4 text-red-500" onClick={closeDetailModal}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default LoanManagement;
