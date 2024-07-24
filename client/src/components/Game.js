import React, { useState, useEffect, useContext } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { makeMove, fetchGameState, resignGame, offerDraw, acceptDraw } from "../services/api";
import { AuthContext } from "../auth/AuthContext";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { FaUserCircle } from 'react-icons/fa';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const socket = io("http://localhost:5000");

const Game = () => {
  const [game, setGame] = useState(new Chess());
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [playerWhite, setPlayerWhite] = useState(null);
  const [playerBlack, setPlayerBlack] = useState(null);
  const [boardSize, setBoardSize] = useState(480);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isResignDialogOpen, setIsResignDialogOpen] = useState(false);
  const [isDrawOffered, setIsDrawOffered] = useState(false);
  const [isDrawOfferDialogOpen, setIsDrawOfferDialogOpen] = useState(false);
  const [isGameOverDialogOpen, setIsGameOverDialogOpen] = useState(false);
  const [gameResult, setGameResult] = useState('');
  const { user } = useContext(AuthContext);
  const { gameID } = useParams();

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      const maxSize = Math.min(window.innerWidth * 0.6, window.innerHeight * 0.75);
      setBoardSize(maxSize);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const setGameState = async () => {
      try {
        const response = await fetchGameState(gameID);
        setGame(new Chess(response.data.state));
        setPlayerWhite(response.data.w);
        setPlayerBlack(response.data.b);
        if (user) setBoardOrientation(response.data.b._id === user.id ? 'black' : 'white');
      } catch (e) {
        console.error("Unable to fetch game", e);
      }
    };
    setGameState();

    socket.on("drawOffered", (data) => {
      if (data.offeredBy !== user.id) {
        setIsDrawOfferDialogOpen(true);
      }
    });

    socket.on("gameEnded", (data) => {
      setGameResult(getResultMessage(data.game.result, data.reason));
      setIsGameOverDialogOpen(true);
    });

    socket.emit("joinGame", gameID);
    socket.on("moveMade", (updatedGame) => {
      setGame(new Chess(updatedGame.state));
    });

    socket.on("drawOffered", () => {
      setIsDrawOffered(true);
    });

    socket.on("gameOver", (result) => {
      setGameResult(result);
      setIsGameOverDialogOpen(true);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [gameID, user]);

  const getResultMessage = (result, reason) => {
    switch(result) {
      case 'w':
        return `White wins${reason ? ` by ${reason}` : ''}`;
      case 'b':
        return `Black wins${reason ? ` by ${reason}` : ''}`;
      case 'd':
        return `Game drawn${reason ? ` by ${reason}` : ''}`;
      default:
        return `Game over: ${result}`;
    }
  };

  const handleMove = async (move) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      if (result === null) return false;

      setGame(newGame);
      const response = await makeMove(gameID, move);
      setGame(new Chess(response.data.state));
      return true;
    } catch (e) {
      console.error("Invalid move", e);
      setGame(new Chess(game.fen()));
      return false;
    }
  };

  const onDrop = async (sourceSquare, targetSquare) => {
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };
    return await handleMove(move);
  };

  const handleResign = async () => {
    setIsResignDialogOpen(false);
    try {
      await resignGame(gameID);
      setGameResult(`${game.turn() === 'w' ? 'Black' : 'White'} wins by resignation`);
      setIsGameOverDialogOpen(true);
    } catch (e) {
      console.error("Error resigning game", e);
    }
  };

  const handleDrawOffer = async () => {
    try {
      await offerDraw(gameID);
      socket.emit("offerDraw", gameID);
    } catch (e) {
      console.error("Error offering draw", e);
    }
  };

  const handleAcceptDraw = async () => {
    try {
      await acceptDraw(gameID);
      setGameResult("Game drawn by agreement");
      setIsGameOverDialogOpen(true);
    } catch (e) {
      console.error("Error accepting draw", e);
    }
  };

  const handleDeclineDraw = () => {
    setIsDrawOfferDialogOpen(false);
    setIsDrawOffered(false);
  };

  const sideSpace = `${(windowSize.width - (boardSize * 1.5)) / 2}px`;
  const topPlayer = boardOrientation === 'white' ? playerBlack?.username : playerWhite?.username;
  const bottomPlayer = boardOrientation === 'white' ? playerWhite?.username : playerBlack?.username;

  return (
    <div className="flex flex-col min-h-99 py-10 bg-[#1e2124] text-white">
      <div className="flex-grow flex items-center justify-center">
        <div className="flex items-start justify-between w-full" style={{ paddingLeft: sideSpace, paddingRight: sideSpace }}>
          <div className="flex items-center">
            <div className={`w-4 mr-2 rounded-xl ${game.turn() === 'w' ? 'bg-white' : 'bg-black'}`} style={{ height: `${boardSize}px` }}></div>
            <div className="flex flex-col items-start">
              <div className="mb-2 text-2xl font-semibold inline-flex items-center">
                <FaUserCircle className="mr-2" />
                {topPlayer}
              </div>
              <Chessboard 
                position={game.fen()} 
                onPieceDrop={onDrop} 
                boardWidth={boardSize}
                boardOrientation={boardOrientation}
                customDarkSquareStyle={{ backgroundColor: "#727072" }}
                customLightSquareStyle={{ backgroundColor: "#D2D6EF" }}
              />
              <div className="mt-2 text-2xl font-semibold inline-flex items-center">
                <FaUserCircle className="mr-2" />
                {bottomPlayer}
              </div>
            </div>
          </div>
          <div className="items-center min-h-full flex flex-col py-10 space-y-4" style={{ width: `${boardSize * 0.6}px` }}>
            <button 
              className="w-11/12 py-3 bg-[#D2D6EF] text-[#727072] rounded-md hover:bg-[#B2B6CF] transition-colors duration-200 font-semibold text-lg"
              onClick={() => setIsResignDialogOpen(true)}
            >
              Resign
            </button>
            <button 
              className="w-11/12 py-3 bg-[#727072] text-[#D2D6EF] rounded-md hover:bg-[#525052] transition-colors duration-200 font-semibold text-lg"
              onClick={isDrawOffered ? handleAcceptDraw : handleDrawOffer}
            >
              {isDrawOffered ? "Accept Draw" : "Offer Draw"}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={isDrawOfferDialogOpen} onClose={handleDeclineDraw}>
        <DialogTitle>Draw Offered</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your opponent has offered a draw. Do you accept?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <button onClick={handleDeclineDraw} className="px-4 py-2 bg-[#727072] text-white rounded">Decline</button>
          <button onClick={handleAcceptDraw} className="px-4 py-2 bg-green-500 text-white rounded">Accept</button>
        </DialogActions>
      </Dialog>

      <Dialog open={isResignDialogOpen} onClose={() => setIsResignDialogOpen(false)}>
        <DialogTitle>Confirm Resignation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to resign this game?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <button onClick={() => setIsResignDialogOpen(false)} className="px-4 py-2 bg-[#727072] text-white rounded">Cancel</button>
          <button onClick={handleResign} className="px-4 py-2 bg-red-500 text-white rounded">Resign</button>
        </DialogActions>
      </Dialog>

      <Dialog open={isGameOverDialogOpen} onClose={() => setIsGameOverDialogOpen(false)}>
        <DialogTitle>Game Over</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {gameResult}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <button onClick={() => setIsGameOverDialogOpen(false)} className="px-4 py-2 bg-[#727072] text-white rounded">Close</button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Game;