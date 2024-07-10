import React, { useState, useEffect, useContext } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import axios from "axios";
import { makeMove } from "../services/api";
import { AuthContext } from "../auth/AuthContext";
import { useParams } from "react-router-dom";

const Game = () => {
  const [game, setGame] = useState(new Chess());
  const user = useContext(AuthContext);
  const { gameID } = useParams();

  // load game initially
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/game/${gameID}`
        );
        setGame(new Chess(response.data.state));
        console.log(response.data.state);
      } catch (e) {
        console.log("error fetching game", e);
      }
    };
    fetchGameState();
  }, [gameID]);

  // optimistically render move, backtrack if illegal
  const handleMove = async (move) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      if (result === null) {
        return false;
      }

      setGame(newGame);
      const response = await makeMove(gameID, move);
      setGame(new Chess(response.data.state));
    } catch (e) {
      console.log("invalid move", e);
    }
  };

  function onDrop(preSquare, postSquare) {
    const move = handleMove({
      from: preSquare,
      to: postSquare,
      promotion: "q",
    });
    if (move === null) {
      return false;
    }
    return true;
  }

  return (
    <div>
      <h2>Game</h2>
      <Chessboard position={game.fen()} onPieceDrop={onDrop}></Chessboard>
    </div>
  );
};

export default Game;
