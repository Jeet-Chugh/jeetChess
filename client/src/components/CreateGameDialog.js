import React, { useState, useContext } from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { AuthContext } from '../auth/AuthContext';
import { getUserByUsername, createGame } from '../services/api';

const CreateGameDialog = ({ open, onClose, onGameCreated }) => {
  const [opponent, setOpponent] = useState('');
  const [color, setColor] = useState('random');
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Find opponent's user ID
      const opponentResponse = await getUserByUsername(opponent);
      if (!opponentResponse.data) {
        setError('Opponent not found');
        return;
      }
      const opponentId = opponentResponse.data._id;

      // Determine final color
      let finalColor = color;
      if (finalColor === 'random') {
        finalColor = Math.random() >= 0.5 ? 'w' : 'b';
      }

      // Create game object
      const gameData = {
        w: finalColor === 'w' ? user.id : opponentId,
        b: finalColor === 'b' ? user.id : opponentId,
        state: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      };

      const response = await createGame(gameData);
      onGameCreated(response.data._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create game');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create a New Game</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter the username of your opponent and choose your color.
        </DialogContentText>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="opponent" className="block text-gray-700 font-bold mb-2">
              Opponent's Username
            </label>
            <input
              type="text"
              id="opponent"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Choose Your Color</label>
            <div className="flex justify-between">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="w"
                  checked={color === 'w'}
                  onChange={() => setColor('w')}
                  className="form-radio"
                />
                <span className="ml-2">White</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="b"
                  checked={color === 'b'}
                  onChange={() => setColor('b')}
                  className="form-radio"
                />
                <span className="ml-2">Black</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="random"
                  checked={color === 'random'}
                  onChange={() => setColor('random')}
                  className="form-radio"
                />
                <span className="ml-2">Random</span>
              </label>
            </div>
          </div>
        </form>
      </DialogContent>
      <DialogActions>
        <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
          Cancel
        </button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Create Game
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGameDialog;