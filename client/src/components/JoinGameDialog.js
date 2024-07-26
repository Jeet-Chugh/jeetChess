import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const JoinGameDialog = ({ open, onClose, onGameJoined }) => {
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      navigate(`/game/${gameId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join game');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Join a Game</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter the Game ID to join an existing game.
        </DialogContentText>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="gameId" className="block text-gray-700 font-bold mb-2">
              Game ID
            </label>
            <input
              type="text"
              id="gameId"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </form>
      </DialogContent>
      <DialogActions>
        <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
          Cancel
        </button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Join Game
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinGameDialog;