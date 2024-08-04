const { createServer } = require('http');
const cors = require('cors');
const express = require('express');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const gameRouter = require('./routes/game');
const userRouter = require('./routes/user');

const app = express();
const httpServer = createServer(app);
const io = setupSocketIO(httpServer);

setupMiddleware(app, io);
setupRoutes(app);
setupSocketHandlers(io);
connectToDatabase();
startServer(httpServer);

function setupSocketIO(httpServer) {
  return new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ['GET', 'POST']
    }
  });
}

function setupMiddleware(app, io) {
  app.use(cors());
  app.use(express.json());
  app.use((req, res, next) => {
    req.io = io;
    next();
  });
}

function setupRoutes(app) {
  app.get('/', (req, res) => {
    res.send('Hello World');
  });
  app.use('/api/game', gameRouter);
  app.use('/api/user', userRouter);
}

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log("Connected to socket!");

    socket.on("declineDraw", (gameID) => {
      io.to(gameID).emit("drawReset");
    });

    socket.on("joinGame", (gameID) => {
      socket.join(gameID);
    });

    socket.on('disconnect', () => {
      console.log("Disconnected from socket.");
    });
  });
}

function connectToDatabase() {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
}

function startServer(httpServer) {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}