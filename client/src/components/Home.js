import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { AuthContext } from '../auth/AuthContext';
import { FaUserCircle } from 'react-icons/fa';
import CreateGameDialog from './CreateGameDialog';
import JoinGameDialog from './JoinGameDialog';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isCreateGameDialogOpen, setIsCreateGameDialogOpen] = useState(false);
  const [isJoinGameDialogOpen, setIsJoinGameDialogOpen] = useState(false);
  const [boardSize, setBoardSize] = useState(480);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      const maxSize = Math.min(window.innerWidth * 0.6, window.innerHeight * 0.8);
      setBoardSize(maxSize);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sideSpace = `${(windowSize.width - (boardSize * 1.5)) / 2}px`;
   
  const onCreateGameClicked = () => {
    setIsCreateGameDialogOpen(true);
  }

  const onJoinGameClicked = () => {
    setIsJoinGameDialogOpen(true);
  }

  const handleGameCreated = (gameId) => {
    navigate(`/game/${gameId}`);
  }

  const handleGameJoined = (gameId) => {
    navigate(`/game/${gameId}`);
  }

  return (
    <div className="flex flex-col min-h-99 py-10 bg-gray-800 text-white">
      <div className="flex-grow flex items-center justify">
        <div className="flex items-start justify-between w-full" style={{ paddingLeft: sideSpace, paddingRight: sideSpace }}>
          <div className="flex flex-col items-start">
            <Chessboard 
              boardWidth={boardSize}
              customDarkSquareStyle={{ backgroundColor: "#727072" }}
              customLightSquareStyle={{ backgroundColor: "#D2D6EF" }}
            />
            <div className="mt-2 text-2xl font-semibold inline-flex items-center">
              <FaUserCircle className="mr-2" />
              {user ? user.username : "Guest"}
            </div>
          </div>
          <div className="items-center min-h-full flex flex-col py-10 space-y-4" style={{ width: `${boardSize * 0.6}px` }}>
            <button 
              className="w-11/12 py-3 bg-[#D2D6EF] text-[#727072] rounded-md hover:bg-[#B2B6CF] transition-colors duration-200 font-semibold text-lg"
              onClick={onCreateGameClicked}
            >
              Create Game
            </button>
            <button 
              className="w-11/12 py-3 bg-[#727072] text-[#D2D6EF] rounded-md hover:bg-[#525052] transition-colors duration-200 font-semibold text-lg"
              onClick={onJoinGameClicked}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
      <CreateGameDialog
        open={isCreateGameDialogOpen}
        onClose={() => setIsCreateGameDialogOpen(false)}
        onGameCreated={handleGameCreated}
      />
      <JoinGameDialog
        open={isJoinGameDialogOpen}
        onClose={() => setIsJoinGameDialogOpen(false)}
        onGameJoined={handleGameJoined}
      />
    </div>
  );
};

export default Home;