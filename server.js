// server.js
// where your node app starts
// Source - https://glitch.com/edit/#!/p5js?path=server.js%3A17%3A0

// init project
var express = require("express");
var app = express();
// Adding socket stuff here based on Paolo's p5-socket - https://github.com/molleindustria/p5-socket
// README in that project says that it should work in glitch out-of-box! (might just have to update package.json?)
var http = require("http").createServer(app);
var io = require("socket.io")(http);

//the rate the server updates all the clients, 10fps
//setInterval works in milliseconds
var UPDATE_TIME = 1000 / 3;

//We want the server to keep track of the whole game state and the clients just to send updates
//in this case the game state are the coordinates of each player
var gameState = {
  players: {}
};

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("src"));
app.use(express.static("node_modules/p5/lib"));
app.use(express.static("node_modules/p5/lib/addons"));
//when a client connects
io.on("connection", function(socket) {
  //this appears in the terminal
  console.log("A user connected");

  //this is sent to the client upon connection
  socket.emit("message", "Hello welcome!");

  /*
    wait for the client to send me the initial coordinates 
    and create a player object. Each socket has a unique id 
    which I use to keep track of the players
    eg. gameState.players.FT7fYM_bwVZgqXkgAAAB 
    is an object containing the x and y coordinates 
    */
  socket.on("newPlayer", function(obj) {
    //object creation in javascript
    gameState.players[socket.id] = {
      x: obj.x,
      y: obj.y
    };

    //gameState.players is an object, not an array or list
    //to get the number of players we have to count the number of property names
    //Object.keys
    console.log(
      "Creating player " +
        socket.id +
        ". There are now " +
        Object.keys(gameState.players).length +
        " players"
    );
  });

  //when a client disconnects I have to delete its player object
  //or I would end up with ghost players
  socket.on("disconnect", function() {
    console.log("User disconnected - destroying player " + socket.id);

    //delete the player object
    delete gameState.players[socket.id];

    console.log(
      "There are now " + Object.keys(gameState.players).length + " players"
    );
  });

  //when I receive an update from a client, update the game state
  socket.on("clientUpdate", function(obj) {
    // console.log("clientUpdate received!");
    if (socket.id != null) {
      gameState.players[socket.id].x = obj.x;
      gameState.players[socket.id].y = obj.y;
    }
  });

  //setInterval calls the function at the given interval in time
  //the server sends the whole game state to all players
  setInterval(function() {
    io.sockets.emit("state", gameState);
    // console.log("emitting gameState!");
  }, UPDATE_TIME);
});

// listen for requests :)
var listener = http.listen(3000, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
