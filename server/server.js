const { createServer } = require('http')
const express = require('express');
const { Server } = require('socket.io')

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// setup and create http server with express
const app = express();
app.use(express.json());
const httpServer = createServer(app)

// connect socket.io to http server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // eventually change to client server
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World');
  console.log(req.headers)
});

// use predefined routes
const gameRouter = require('./routes/game')
const userRouter = require('./routes/user')
app.use('/game', gameRouter)
app.use('/user', userRouter)

// socket.io connection
io.on('connection', (socket) => {
  console.log("Connected to socket!")

  // example socket route
  socket.on('example_message', (data) => {
    console.log('received example_message')
  });

  socket.on('disconnect', () => {
    console.log("Disconnected from socket.")
  });
});

// host server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});