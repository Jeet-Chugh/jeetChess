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
  const [currentTurn, setCurrentTurn] = useState('w');
  const [playerWhite, setPlayerWhite] = useState(null);
  const [playerBlack, setPlayerBlack] = useState(null);
  const [boardSize, setBoardSize] = useState(480);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isResignDialogOpen, setIsResignDialogOpen] = useState(false);
  const [isDrawOffered, setIsDrawOffered] = useState(false);
  const [drawOfferedBy, setDrawOfferedBy] = useState(null);
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
        setCurrentTurn(response.data.turn);
        setPlayerWhite(response.data.w);
        setPlayerBlack(response.data.b);
        if (user) setBoardOrientation(response.data.b._id === user.id ? 'black' : 'white');
        
        // Check if there's an existing draw offer
        if (response.data.drawOffer) {
          setIsDrawOffered(true);
          setDrawOfferedBy(response.data.drawOffer);
        }
      } catch (e) {
        console.error("Unable to fetch game", e);
      }
    };
    setGameState();

    socket.on("drawOffered", (data) => {
      setIsDrawOffered(true);
      setDrawOfferedBy(data.offeredBy);
      if (data.offeredBy !== user.id) {
        setIsDrawOfferDialogOpen(true);
      }
    });

    socket.on("drawReset", () => {
      setIsDrawOffered(false);
      setDrawOfferedBy(null);
    });

    socket.on("gameEnded", (data) => {
      setGameResult(getResultMessage(data.game.result, data.reason));
      setIsGameOverDialogOpen(true);
      setIsDrawOffered(false);
      setDrawOfferedBy(null);
      setIsDrawOfferDialogOpen(false);
    });

    socket.emit("joinGame", gameID);
    socket.on("moveMade", (updatedGame) => {
      setGame(new Chess(updatedGame.game.state));
      // Reset draw offer after each move
      setCurrentTurn(updatedGame.turn);
      setIsDrawOffered(false);
      setDrawOfferedBy(null);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off("drawOffered");
      socket.off("drawReset");
      socket.off("gameEnded");
      socket.off("moveMade");
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
      // Reset draw offer after each move
      setIsDrawOffered(false);
      setDrawOfferedBy(null);
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
      setIsDrawOffered(true);
      setDrawOfferedBy(user.id);
      socket.emit("offerDraw", { gameID, offeredBy: user.id });
    } catch (e) {
      console.error("Error offering draw", e);
    }
  };

  const handleAcceptDraw = async () => {
    try {
      await acceptDraw(gameID);
      setGameResult("Game drawn by agreement");
      setIsGameOverDialogOpen(true);
      setIsDrawOfferDialogOpen(false);
      setIsDrawOffered(false);
      setDrawOfferedBy(null);
    } catch (e) {
      console.error("Error accepting draw", e);
    }
  };

  const handleDeclineDraw = () => {
    setIsDrawOfferDialogOpen(false);
    setIsDrawOffered(false);
    setDrawOfferedBy(null);
    socket.emit("declineDraw", gameID);
  };

  const isGameOver = () => {
    return game.isGameOver() || game.isDraw();
  };

  const sideSpace = `${(windowSize.width - (boardSize * 1.5)) / 2}px`;
  const topPlayer = boardOrientation === 'white' ? playerBlack?.username : playerWhite?.username;
  const bottomPlayer = boardOrientation === 'white' ? playerWhite?.username : playerBlack?.username;

  const isCurrentPlayersTurn = (user?.id === playerWhite?._id && game.turn() === 'w') || (user?.id === playerBlack?._id && game.turn() === 'b');
  const isDrawButtonDisabled = isGameOver() || !isCurrentPlayersTurn;

  return (
    <div className="flex flex-col min-h-99 py-10 text-white">
      <div className="flex-grow flex items-center justify-center">
        <div className="flex items-start justify-between w-full" style={{ paddingLeft: sideSpace, paddingRight: sideSpace }}>
          <div className="flex items-center">
            <div className={`w-2 mr-2 ${currentTurn === 'w' ? 'bg-white' : 'bg-black'}`} style={{ height: `${boardSize}px` }}></div>
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
              className={`w-11/12 py-3 ${isGameOver() ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#D2D6EF] hover:bg-[#B2B6CF]'} text-[#727072] rounded-md transition-colors duration-200 font-semibold text-lg`}
              onClick={() => setIsResignDialogOpen(true)}
              disabled={isGameOver()}
            >
              Resign
            </button>
            <button 
              className={`w-11/12 py-3 ${isDrawButtonDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#727072] hover:bg-[#525052]'} text-[#D2D6EF] rounded-md transition-colors duration-200 font-semibold text-lg`}
              onClick={isDrawOffered && drawOfferedBy !== user.id ? handleAcceptDraw : handleDrawOffer}
              disabled={isDrawButtonDisabled}
            >
              {isDrawOffered ? (drawOfferedBy === user.id ? "Draw Offered" : "Accept Draw") : "Offer Draw"}
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