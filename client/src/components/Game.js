import React, { useState, useEffect, useContext } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { makeMove, fetchGameState } from "../services/api";
import { AuthContext } from "../auth/AuthContext";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const Game = () => {
  const [game, setGame] = useState(new Chess());
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [playerWhite, setPlayerWhite] = useState(null);
  const [playerBlack, setPlayerBlack] = useState(null);
  const { user } = useContext(AuthContext);
  const { gameID } = useParams();

  useEffect(() => {
    const setGameState = async () => {
      try {
        const response = await fetchGameState(gameID);
        setGame(new Chess(response.data.state));
        
        // Set players
        setPlayerWhite(response.data.players.white);
        setPlayerBlack(response.data.players.black);
        
        // Set board orientation based on user color
        if (user && response.data.players) {
          const userColor = response.data.players.white.id === user.id ? 'white' : 'black';
          setBoardOrientation(userColor);
        }
      } catch (e) {
        console.error("Unable to fetch game", e);
      }
    };
    setGameState();

    socket.emit("joinGame", gameID);
    socket.on("moveMade", (updatedGame) => {
      setGame(new Chess(updatedGame.state));
    });
    socket.on("gameStarted", (newGame) => {
      setGame(new Chess(newGame.state));
      setPlayerWhite(newGame.players.white);
      setPlayerBlack(newGame.players.black);
      // Update orientation if game just started
      if (user) {
        const userColor = newGame.players.white.id === user.id ? 'white' : 'black';
        setBoardOrientation(userColor);
      }
    });
    return () => {
      socket.off("moveMade");
      socket.off("gameStarted");
    };
  }, [gameID, user]);

  const handleMove = async (move) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      if (result === null) {
        return false; // Illegal move
      } 

      setGame(newGame);

      const response = await makeMove(gameID, move);
      setGame(new Chess(response.data.state));
      return true;
    } catch (e) {
      console.error("Invalid move", e);
      // Rollback to previous state if move fails
      setGame(new Chess(game.fen()));
      return false;
    }
  };

  const onDrop = async (sourceSquare, targetSquare) => {
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // change this eventually
    };

    return await handleMove(move);
  };

  const getPlayerName = (color) => {
    const player = color === 'white' ? playerWhite : playerBlack;
    return player ? player.username : 'Waiting for player...';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800 text-white p-4">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">Chess Game</h2>
        <div className="flex flex-col items-center">
          <div className="mb-2 text-lg font-semibold">
            {boardOrientation === 'white' ? getPlayerName('black') : getPlayerName('white')}
          </div>
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop} 
            boardWidth={480} 
            boardOrientation={boardOrientation}
          />
          <div className="mt-2 text-lg font-semibold">
            {boardOrientation === 'white' ? getPlayerName('white') : getPlayerName('black')}
          </div>
        </div>
        <div className="mt-4 text-center">
          <p>Current player: {game.turn() === 'w' ? 'White' : 'Black'}</p>
          <p>Your color: {user ? boardOrientation : 'Spectator'}</p>
        </div>
      </div>
    </div>
  );
};

export default Game;