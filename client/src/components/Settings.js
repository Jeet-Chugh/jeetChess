import React, { useState, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { logout, updateUser } = useContext(AuthContext);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/user/change-username', { newUsername });
      updateUser({ username: newUsername });
      setMessage('Username updated successfully');
      setNewUsername('');
    } catch (error) {
      setMessage(error.response?.data || 'Error changing username');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    try {
      await api.post('/api/user/change-password', { currentPassword, newPassword });
      setMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage(error.response?.data || 'Error changing password');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/api/user/delete-account');
        logout();
        navigate('/');
      } catch (error) {
        setMessage(error.response?.data || 'Error deleting account');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-900 rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-white">Account Settings</h1>
      {message && <p className="mb-4 text-green-500">{message}</p>}
      
      <form onSubmit={handleUsernameChange} className="mb-6">
        <h3 className="text-xl font-semibold mb-2 text-white">Change Username</h3>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="New Username"
          className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
          required
        />
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
          Update Username
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="mb-6">
        <h3 className="text-xl font-semibold mb-2 text-white">Change Password</h3>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current Password"
          className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
          required
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm New Password"
          className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
          required
        />
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
          Change Password
        </button>
      </form>

      <div>
        <button
          onClick={handleDeleteAccount}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default Settings;