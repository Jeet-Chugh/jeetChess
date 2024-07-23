import React, { useState, useEffect, useContext } from 'react';
import { Chessboard } from 'react-chessboard';
import { AuthContext } from '../auth/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);
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

  return (
    <div className="flex flex-col min-h-99 py-10 bg-[#1e2124] text-white">
      <div className="flex-grow flex items-center justify">
        <div className="flex items-start justify-between w-full" style={{ paddingLeft: sideSpace, paddingRight: sideSpace }}>
          <div className="flex flex-col items-start">
            <Chessboard 
              boardWidth={boardSize}
              customDarkSquareStyle={{ backgroundColor: "#727072" }}
              customLightSquareStyle={{ backgroundColor: "#D2D6EF" }}
            />
            <div className="mt-2 text-2xl font-semibold">
              {user? user.username: "Guest"}
            </div>
          </div>
          <div className="items-center min-h-full flex flex-col py-10 space-y-4" style={{ width: `${boardSize * 0.6}px` }}>
            <button 
              className="w-11/12 py-3 bg-[#D2D6EF] text-[#727072] rounded-md hover:bg-[#B2B6CF] transition-colors duration-200 font-semibold text-lg"
              onClick={() => console.log('Create game clicked')}
            >
              Create Game
            </button>
            <button 
              className="w-11/12 py-3 bg-[#727072] text-[#D2D6EF] rounded-md hover:bg-[#525052] transition-colors duration-200 font-semibold text-lg"
              onClick={() => console.log('Join game clicked')}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;