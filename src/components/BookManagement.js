import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faInfoCircle, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import Navbar from './Navbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [titleSearch, setTitleSearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [currentPageUrl, setCurrentPageUrl] = useState('http://127.0.0.1:8000/api/books/'); // Set initial URL for books
  const [pagination, setPagination] = useState({ next: null, previous: null });
  const [showModal, setShowModal] = useState(false);  // Add/Edit Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);  // Detail Modal state
  const [selectedImage, setSelectedImage] = useState(null); // For previewing selected image
  const [currentBook, setCurrentBook] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: '',
    publication_date: '',
    availability: true,
    cover_image: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State to track if user is authenticated
  const [credentials, setCredentials] = useState({ username: '', password: '' }); // For login
  const navigate = useNavigate();

  // Check if the user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
      fetchBooks(currentPageUrl); // Fetch books when page loads or URL changes
    }
  }, [currentPageUrl]);

  // Handle login and obtain JWT token
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', credentials);
      const { access } = response.data;

      // Store the access token in localStorage
      localStorage.setItem('accessToken', access);
      setIsAuthenticated(true);
      fetchBooks(currentPageUrl); // Fetch books after login

      Swal.fire('Connexion réussie', 'Vous êtes maintenant connecté', 'success');
    } catch (error) {
      Swal.fire('Erreur de connexion', 'Nom d\'utilisateur ou mot de passe incorrect', 'error');
      console.error('Erreur de connexion:', error);
    }
  };

  const fetchBooks = async (url) => {
    const token = localStorage.getItem('accessToken'); // Get the JWT token

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,  // Include the token in the header
        },
      });
      setBooks(response.data.results);
      setPagination({ next: response.data.next, previous: response.data.previous });
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
    }
  };

  const showAlert = (message, icon = 'success') => {
    Swal.fire({
      position: 'top-end',
      icon: icon,
      title: message,
      showConfirmButton: false,
      timer: 1500,
      background: '#e6fffa',
      toast: true,
      color: '#2d2a2a',
    });
  };

  const openModal = (book = null) => {
    setIsEditing(!!book);
    setCurrentBook(book || { title: '', author: '', genre: '', isbn: '', publication_date: '', availability: true, cover_image: null });
    setSelectedImage(null); // Reset selected image when opening modal
    setShowModal(true); // Open the Add/Edit modal
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const openDetailModal = (book) => {
    setCurrentBook(book);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file); // Store the selected image for preview
    setCurrentBook({ ...currentBook, cover_image: file }); // Update the currentBook with the selected file
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken'); // Get the JWT token

    // Validation des champs avant l'envoi
    if (!currentBook.title || !currentBook.author || !currentBook.genre || !currentBook.isbn || !currentBook.publication_date) {
      showAlert('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', currentBook.title);
    formData.append('author', currentBook.author);
    formData.append('genre', currentBook.genre);
    formData.append('isbn', currentBook.isbn);
    formData.append('publication_date', currentBook.publication_date);
    formData.append('availability', currentBook.availability);

    if (currentBook.cover_image && typeof currentBook.cover_image !== 'string') {
      formData.append('cover_image', currentBook.cover_image);
    }

    try {
      if (isEditing) {
        await axios.put(`http://127.0.0.1:8000/api/books/${currentBook.id}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,  // Include the token in the header
          },
        });
        showAlert('Livre mis à jour avec succès !');
      } else {
        await axios.post('http://127.0.0.1:8000/api/books/', formData, {
          headers: {
            Authorization: `Bearer ${token}`,  // Include the token in the header
            'Content-Type': 'multipart/form-data',
          },
        });
        showAlert('Livre ajouté avec succès !');
      }

      closeModal();
      fetchBooks(currentPageUrl); // Recharger la liste des livres après ajout ou modification
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du livre:', error);

      if (error.response && error.response.data) {
        showAlert('Erreur: ' + JSON.stringify(error.response.data), 'error');
      } else {
        showAlert('Une erreur s\'est produite lors de la sauvegarde.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('accessToken'); // Get the JWT token

    Swal.fire({
      title: 'Êtes-vous sûr de vouloir supprimer ce livre ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#24d80a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://127.0.0.1:8000/api/books/${id}/`, {
            headers: {
              Authorization: `Bearer ${token}`,  // Include the token in the header
            },
          });
          fetchBooks(currentPageUrl); // Reload current page after deletion
          showAlert('Livre supprimé avec succès !', 'success');
        } catch (error) {
          console.error('Erreur lors de la suppression du livre:', error);
        }
      }
    });
  };

  const handleSearch = () => {
    const searchResults = books.filter(
      (book) =>
        book.title.toLowerCase().includes(titleSearch.toLowerCase()) &&
        book.author.toLowerCase().includes(authorSearch.toLowerCase())
    );
    setBooks(searchResults);
  };

  useEffect(() => {
    handleSearch();
  }, [titleSearch, authorSearch]);

  // If user is not authenticated, show the login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-1/3">
          <h2 className="text-2xl mb-4 text-green-600">Connexion</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block mb-2">Nom d'utilisateur</label>
              <input
                type="text"
                className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Mot de passe</label>
              <input
                type="password"
                className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-8">Gestion des livres</h1>

        <div className="mb-4 flex justify-between">
          <input
            type="text"
            placeholder="Rechercher par titre"
            value={titleSearch}
            onChange={(e) => setTitleSearch(e.target.value)}
            className="border border-green-500 p-2 rounded mr-4 w-1/3 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="Rechercher par auteur"
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
            className="border border-green-500 p-2 rounded w-1/3 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={() => openModal()}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
            Ajouter un livre
          </button>
        </div>
        {books.length > 0 ? (
        <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
            <thead className="bg-green-600 text-white">
            <tr>
                <th className="py-4 px-6 text-center">Titre</th>
                <th className="py-4 px-6 text-center">Auteur</th>
                <th className="py-4 px-6 text-center">Genre</th>
                <th className="py-4 px-6 text-center">Disponibilité</th>
                <th className="py-4 px-6 text-center">Actions</th>
            </tr>
            </thead>
            <tbody>
            {books.map((book) => (
                <tr
                key={book.id}
                className="hover:bg-gray-100 transition-colors duration-200 text-center border-b"  // Hover effect and centering text
                >
                <td className="py-4 px-6">{book.title}</td>
                <td className="py-4 px-6">{book.author}</td>
                <td className="py-4 px-6">{book.genre}</td>
                <td className="py-4 px-6">
                    {book.availability ? (
                        <span className="text-green-600 font-bold bg-green-100 border border-green-600 rounded px-2 py-1">
                        Disponible
                        </span>
                    ) : (
                        <span className="text-red-600 font-bold bg-red-100 border border-red-600 rounded px-2 py-1">
                        Indisponible
                        </span>
                    )}
                </td>
                <td className="py-4 px-6 flex justify-center space-x-4">
                    {/* Edit button */}
                    <button
                    onClick={() => openModal(book)}
                    className="text-blue-500 hover:text-blue-700"
                    >
                    <FontAwesomeIcon icon={faEdit} />
                    </button>

                    {/* Delete button */}
                    <button
                    onClick={() => handleDelete(book.id)}
                    className="text-red-500 hover:text-red-700"
                    >
                    <FontAwesomeIcon icon={faTrash} />
                    </button>

                    {/* Details button */}
                    <button
                    onClick={() => openDetailModal(book)}
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
        <p className="text-center text-gray-500">Aucun livre disponible</p>
        )}
                    
        {/* Pagination */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setCurrentPageUrl(pagination.previous)}
            className={`px-4 py-2 bg-white border border-green-500 rounded ${
              !pagination.previous ? 'text-gray-400' : 'text-green-500'
            }`}
            disabled={!pagination.previous}
          >
            Précédent
          </button>
          <button
            onClick={() => setCurrentPageUrl(pagination.next)}
            className={`px-4 py-2 bg-white border border-green-500 rounded ${
              !pagination.next ? 'text-gray-400' : 'text-green-500'
            }`}
            disabled={!pagination.next}
          >
            Suivant
          </button>
        </div>

        {/* Add/Edit Book Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
              <h2 className="text-2xl mb-4 text-green-600">{isEditing ? 'Modifier Livre' : 'Ajouter Livre'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-2">Titre</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentBook.title}
                    onChange={(e) => setCurrentBook({ ...currentBook, title: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Auteur</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentBook.author}
                    onChange={(e) => setCurrentBook({ ...currentBook, author: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Genre</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentBook.genre}
                    onChange={(e) => setCurrentBook({ ...currentBook, genre: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">ISBN</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentBook.isbn}
                    onChange={(e) => setCurrentBook({ ...currentBook, isbn: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Date de publication</label>
                  <input
                    type="date"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentBook.publication_date}
                    onChange={(e) => setCurrentBook({ ...currentBook, publication_date: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Image de couverture</label>
                  <input
                    type="file"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    onChange={handleImageChange}
                  />
                  {/* Preview selected image */}
                  {selectedImage && (
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected"
                      className="h-20 w-20 object-cover mt-4"
                    />
                  )}
                  {/* Display current image in case of edit */}
                  {isEditing && currentBook.cover_image && typeof currentBook.cover_image === 'string' && (
                    <img
                      src={currentBook.cover_image}
                      alt={currentBook.title}
                      className="h-20 w-20 object-cover mt-4"
                    />
                  )}
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Disponibilité</label>
                  <select
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentBook.availability}
                    onChange={(e) => setCurrentBook({ ...currentBook, availability: e.target.value === 'true' })}
                  >
                    <option value="true">Disponible</option>
                    <option value="false">Indisponible</option>
                  </select>
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
        {showDetailModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <h2 className="text-2xl mb-4 text-green-600">Détails du livre</h2>

            {/* Flex container to arrange image and details */}
            <div className="flex">
              {/* Image container */}
              <div className="h-80 w-1/3 rounded overflow-hidden mb-4">
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

              {/* Book details container */}
              <div className="w-2/3 pl-6">
                <p className="mb-2"><strong>Titre:</strong> {currentBook.title}</p>
                <p className="mb-2"><strong>Auteur:</strong> {currentBook.author}</p>
                <p className="mb-2"><strong>Genre:</strong> {currentBook.genre}</p>
                <p className="mb-2"><strong>ISBN:</strong> {currentBook.isbn}</p>
                <p className="mb-2"><strong>Date de publication:</strong> {currentBook.publication_date}</p>

                {/* Availability Indicator */}
                <div className="flex items-center space-x-2 mt-4">
                  <p></p>
                  {currentBook.availability ? (
                    <span className="text-green-600 font-bold border border-green-600 rounded px-2 py-1">
                      Disponible
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold border border-red-600 rounded px-2 py-1">
                      Indisponible
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close button */}
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

export default BookManagement;
