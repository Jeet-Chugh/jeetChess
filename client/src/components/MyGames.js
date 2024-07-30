import React, { useState, useEffect, useContext } from 'react';
import { Chessboard } from 'react-chessboard';
import { fetchUserGames } from '../services/api';
import { AuthContext } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const MyGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loadGames = async () => {
      try {
        const response = await fetchUserGames();
        setGames(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching games:', error);
        setError('Failed to load games. Please try again later.');
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  const getResultText = (result, isUserWhite) => {
    if (result === 'n') return 'Ongoing';
    if (result === 'd') return 'Draw';
    return result === (isUserWhite ? 'w' : 'b') ? 'Won' : 'Lost';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {games.length === 0 ? (
        <p className="text-lg">You haven't played any games yet.</p>
      ) : (
        <div className="space-y-6">
          {games.map((game) => (
            <div key={game._id} className="flex shadow-md overflow-hidden bg-white">
              <div className="w-64 h-64 flex-shrink-0">
                <Chessboard
                  position={game.currentPosition}
                  boardWidth={256}
                  boardOrientation={game.isUserWhite ? 'white' : 'black'}
                  customDarkSquareStyle={{ backgroundColor: "#727072" }}
                  customLightSquareStyle={{ backgroundColor: "#D2D6EF" }}
                />
              </div>
              <div className="flex-grow p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-5xl text-gray-600 font-semibold mb-2">
                    {user.username} vs {game.opponent}
                  </h2>
                  <p className="text-3xl text-gray-600 mb-2">
                    {new Date(game.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-2xl text-gray-600 font-medium mb-2">
                    Result: {getResultText(game.result, game.isUserWhite)}
                  </p>
                  <p className="text-2xl text-gray-600">
                    You played as {game.isUserWhite ? 'White' : 'Black'}
                  </p>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xl text-gray-600">
                    {game.moves.length} moves
                  </span>
                  <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded" onClick={ () => navigate(`/game/${game._id}`)}>
                    View Game
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGames;