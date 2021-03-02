const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Game
let numUsers = 0;
let master_speak = true;
let player_speak = false;

io.on('connection', (socket) => {
  let addedUser = false;

  socket.on('new message', (data) => {
    if (socket.username == "1" && master_speak == true) {
      io.emit('new message', data);
      socket.broadcast.emit('new message', {
        username: socket.username,
        message: data,
        speak: master_speak
      });
      master_speak = false;
      player_speak = true;
    }

    if (socket.username == "2" && player_speak == true) {
      io.emit('new message', data);
      socket.broadcast.emit('new message', {
        username: socket.username,
        message: data,
        speak: master_speak
      });
      master_speak = true;
      player_speak = false;
    }
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
