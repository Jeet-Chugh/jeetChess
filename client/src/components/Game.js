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
        
        setPlayerWhite(response.data.w);
        setPlayerBlack(response.data.b);
        if (user) setBoardOrientation(response.data.b._id === user.id ? 'black' : 'white');

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
      setPlayerWhite(newGame.w);
      setPlayerBlack(newGame.b);
      if (user) setBoardOrientation(newGame.data.b._id === user.id ? 'black' : 'white');
    });

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
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

  const topPlayer = boardOrientation === 'white' ? playerBlack?.username : playerWhite;
  const bottomPlayer = boardOrientation === 'white' ? playerWhite?.username : playerBlack;

  return (
    <div className="flex items-center justify-center min-h-screen text-white p-4">
      <div className="p-8 rounded-lg w-full max-w-4xl">
        <div className="flex flex-col text-left">
          <div className="mb-2 text-lg font-semibold">
            {topPlayer}
          </div>
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop} 
            boardWidth={480} 
            boardOrientation={boardOrientation}
            customDarkSquareStyle={{ backgroundColor: "#D2D6EF" }}
            customLightSquareStyle={{ backgroundColor: "#727072" }}
          />
          <div className="mt-2 text-lg font-semibold">
            {bottomPlayer}
          </div>
        </div>
        <div className="mt-4 text-center">
          <p>Current player: {game.turn() === 'w' ? 'White' : 'Black'}</p>
          <p>Your role: {user ? (user.id === playerWhite?._id ? 'White' : (user.id === playerBlack?._id ? 'Black' : 'Spectator')) : 'Spectator'}</p>
        </div>
      </div>
    </div>
  );
};

export default Game;