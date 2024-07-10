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
  const user = useContext(AuthContext);
  const { gameID } = useParams();

  // Load game initially and setup socket listeners
  useEffect(() => {
    const setGameState = async () => {
      try {
        const response = await fetchGameState(gameID);
        setGame(new Chess(response.data.state));
      } catch (e) {
        console.log("Unable to fetch game", e);
      }
    };
    setGameState();

    socket.emit("joinGame", gameID);
    socket.on("moveMade", (updatedGame) => {
      setGame(new Chess(updatedGame.state));
    });
    socket.on("gameStarted", (newGame) => {
      setGame(new Chess(newGame.state));
    });
    return () => {
      socket.off("moveMade");
      socket.off("gameStarted");
    };
  }, [gameID]);

  // Optimistically render move, backtrack if illegal
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
      console.log("Invalid move", e);
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

    const moveSuccess = await handleMove(move);
    return moveSuccess;
  };

  return (
    <div>
      <h2>Game</h2>
      <Chessboard position={game.fen()} onPieceDrop={onDrop}></Chessboard>
    </div>
  );
};

export default Game;
