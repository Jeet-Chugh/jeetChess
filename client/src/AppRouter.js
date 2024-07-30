import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Game from './components/Game';
import Navbar from './components/Navbar';
import Settings from './components/Settings';
import MyGames from './components/MyGames';

const AppRouter = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/game" element={<Game />} />
        <Route path="/game/:gameID" element={<Game />} />
        <Route path="/my-games" element={<MyGames />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
