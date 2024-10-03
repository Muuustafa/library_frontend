import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faInfoCircle, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import Navbar from './Navbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [usernameSearch, setUsernameSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [currentPageUrl, setCurrentPageUrl] = useState('http://127.0.0.1:8000/api/users/');
  const [pagination, setPagination] = useState({ next: null, previous: null });
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    profile_image: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Fetch users on page load and when URL changes
  useEffect(() => {
    const isAuthenticated = !!localStorage.getItem('accessToken');
    if (!isAuthenticated) {
      navigate('/');
    } else {
      fetchUsers(currentPageUrl); // Fetch users when page loads or URL changes
    }
  }, [navigate, currentPageUrl]);

  const fetchUsers = async (url) => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setUsers(response.data.results); // Set users for the current page
      setPagination({ next: response.data.next, previous: response.data.previous }); // Set pagination info
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
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

  const openModal = (user = null) => {
    // Log to ensure this function is called
    console.log('Opening modal with user:', user);

    // If user is passed, we are editing, else we are adding a new user
    setIsEditing(!!user);
    setCurrentUser(user || { username: '', first_name: '', last_name: '', email: '', password: '', profile_image: null });
    setSelectedImage(null); // Reset selected image when opening modal
    setShowModal(true); // Open the Add/Edit modal
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const openDetailModal = (user) => {
    // Log to ensure this function is called
    console.log('Opening detail modal with user:', user);

    setCurrentUser(user);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file); // Store the selected image for preview
    setCurrentUser({ ...currentUser, profile_image: file }); // Update the currentUser with the selected file
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs avant l'envoi
    if (!currentUser.username || !currentUser.first_name || !currentUser.last_name || !currentUser.email) {
      showAlert('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('username', currentUser.username);
    formData.append('first_name', currentUser.first_name);
    formData.append('last_name', currentUser.last_name);
    formData.append('email', currentUser.email);

    if (isEditing) {
      formData.append('password', currentUser.password || '******'); // Ne jamais montrer le vrai mot de passe
    } else {
      formData.append('password', currentUser.password); // Nouveau mot de passe lors de l'ajout
    }

    if (currentUser.profile_image && typeof currentUser.profile_image !== 'string') {
      formData.append('profile_image', currentUser.profile_image);
    }

    try {
      if (isEditing) {
        await axios.put(`http://127.0.0.1:8000/api/users/${currentUser.id}/`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        showAlert('Utilisateur mis à jour avec succès !');
      } else {
        await axios.post('http://127.0.0.1:8000/api/users/', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        showAlert('Utilisateur ajouté avec succès !');
      }

      closeModal();
      fetchUsers(currentPageUrl); // Recharger la liste des utilisateurs après ajout ou modification
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);

      if (error.response && error.response.data) {
        showAlert('Erreur: ' + JSON.stringify(error.response.data), 'error');
      } else {
        showAlert('Une erreur s\'est produite lors de la sauvegarde.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#24d80a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://127.0.0.1:8000/api/users/${id}/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
          fetchUsers(currentPageUrl); // Reload current page after deletion
          showAlert('Utilisateur supprimé avec succès !', 'success');
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        }
      }
    });
  };

  const handleSearch = () => {
    const searchResults = users.filter(
      (user) =>
        user.username.toLowerCase().includes(usernameSearch.toLowerCase()) &&
        (user.first_name.toLowerCase().includes(nameSearch.toLowerCase()) ||
          user.last_name.toLowerCase().includes(nameSearch.toLowerCase()))
    );
    setUsers(searchResults);
  };

  useEffect(() => {
    handleSearch();
  }, [usernameSearch, nameSearch]);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-8">Gestion des utilisateurs</h1>

        <div className="mb-4 flex justify-between">
          <input
            type="text"
            placeholder="Rechercher par nom d'utilisateur"
            value={usernameSearch}
            onChange={(e) => setUsernameSearch(e.target.value)}
            className="border border-green-500 p-2 rounded mr-4 w-1/3 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="Rechercher par prénom ou nom"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="border border-green-500 p-2 rounded w-1/3 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={() => openModal()}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
            Ajouter un utilisateur
          </button>
        </div>
        {users.length > 0 ? (
  <table className="min-w-full bg-white rounded shadow-md overflow-hidden">
    <thead className="bg-green-600 text-white">
      <tr>
        <th className="w-1/5 py-3 px-4 text-center">Nom d'utilisateur</th>
        <th className="w-1/5 py-3 px-4 text-center">Prénom</th>
        <th className="w-1/5 py-3 px-4 text-center">Nom</th>
        <th className="w-1/5 py-3 px-4 text-center">Email</th>
        <th className="w-1/5 py-3 px-4 text-center">Actions</th>
      </tr>
    </thead>
    <tbody>
      {users.map((user) => (
        <tr
          key={user.id}
          className="border-b hover:bg-gray-100 transition-colors duration-200 text-center"  // Hover effect and centering text
        >
          <td className="py-3 px-4">{user.username}</td>
          <td className="py-3 px-4">{user.first_name}</td>
          <td className="py-3 px-4">{user.last_name}</td>
          <td className="py-3 px-4">{user.email}</td>
          <td className="py-3 px-4 flex justify-center space-x-4">
            {/* Edit button */}
            <button
              onClick={() => openModal(user)}
              className="text-blue-500 hover:text-blue-700"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>

            {/* Delete button */}
            <button
              onClick={() => handleDelete(user.id)}
              className="text-red-500 hover:text-red-700"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>

            {/* Details button */}
            <button
              onClick={() => openDetailModal(user)}
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
  <p className="text-center text-gray-500">Aucun utilisateur disponible</p>
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

        {/* Add/Edit User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
              <h2 className="text-2xl mb-4 text-green-600">{isEditing ? 'Modifier Utilisateur' : 'Ajouter Utilisateur'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-2">Nom d'utilisateur</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentUser.username}
                    onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Prénom</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentUser.first_name}
                    onChange={(e) => setCurrentUser({ ...currentUser, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Nom</label>
                  <input
                    type="text"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentUser.last_name}
                    onChange={(e) => setCurrentUser({ ...currentUser, last_name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Email</label>
                  <input
                    type="email"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={currentUser.email}
                    onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Mot de passe</label>
                  <input
                    type="password"
                    className="border border-green-500 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={isEditing ? '******' : currentUser.password} // Show placeholder during editing
                    readOnly={isEditing} // Mot de passe en lecture seule lors de la modification
                    onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Image de profil</label>
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
                  {isEditing && currentUser.profile_image && typeof currentUser.profile_image === 'string' && (
                    <img
                      src={currentUser.profile_image}
                      alt={currentUser.username}
                      className="h-20 w-20 object-cover mt-4"
                    />
                  )}
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
            <h2 className="text-2xl mb-4 text-green-600">Détails Utilisateur</h2>

            {/* Flex container to arrange image and details */}
            <div className="flex">
              {/* Image container */}
              <div className="h-80 w-1/3 rounded overflow-hidden mb-4">
                {currentUser.profile_image ? (
                  <img
                    src={currentUser.profile_image}
                    alt={currentUser.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200 rounded">
                    <span className="text-gray-500">Pas d'image de profil</span>
                  </div>
                )}
              </div>

              {/* User details container */}
              <div className="w-2/3 pl-6">
                <p className="mb-2"><strong>Nom d'utilisateur:</strong> {currentUser.username}</p>
                <p className="mb-2"><strong>Prénom:</strong> {currentUser.first_name}</p>
                <p className="mb-2"><strong>Nom:</strong> {currentUser.last_name}</p>
                <p className="mb-2"><strong>Email:</strong> {currentUser.email}</p>
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

export default UserManagement;
