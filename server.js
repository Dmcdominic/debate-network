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
  players: {},
  // Questions and prompts saved
  open_questions: [],
  questions_w_one_stance: [],
  questions_w_two_stance: [],
  // questions_w_one_debator: [],
  // questions_w_two_debator: [],
  current_debate: null,
  debate_timer: -1
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
      open_questions: [],
      questions_w_one_stance: [],
      questions_w_two_stance: [],
      // questions_w_one_debator: [],
      // questions_w_two_debator: []
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
    try_to_distribute();
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
  // socket.on("clientUpdate", function(obj) {
  //   // console.log("clientUpdate received!");
  //   if (socket.id != null) {
  //   }
  // });


  // --- RECEIVE NEW CONTENT FROM PLAYERS ---

  // Add the new question to gameState
  socket.on("new_open_question", function(obj) {
    if (socket.id != null) {
      obj.contributors = [ socket.id ];
      obj.owner = null;
      gameState.players[socket.id].open_questions = [];
      gameState.open_questions.push(obj);
      try_to_distribute();
    }
  });

  socket.on("new_question_w_one_stance", function(obj) {
    if (socket.id != null) {
      obj.contributors.push(socket.id);
      obj.owner = null;
      gameState.players[socket.id].questions_w_one_stance = [];
      gameState.questions_w_one_stance.push(obj);
      for (let q_index = 0; q_index < gameState.open_questions.length; q_index++) {
        let q = gameState.open_questions[q_index];
        if (q.owner == socket.id) {
          gameState.open_questions.splice(q_index, 1);
        }
      }
      try_to_distribute();
    }
  });

  socket.on("new_question_w_two_stance", function(obj) {
    if (socket.id != null) {
      obj.contributors.push(socket.id);
      obj.owner = null;
      obj.owners = [];
      gameState.players[socket.id].questions_w_two_stance = [];
      gameState.questions_w_two_stance.push(obj);
      for (let q_index = 0; q_index < gameState.questions_w_one_stance.length; q_index++) {
        let q = gameState.questions_w_one_stance[q_index];
        if (q.owner == socket.id) {
          gameState.questions_w_one_stance.splice(q_index, 1);
        }
      }
      try_to_distribute();
    }
  });

  // On an undecided message, remove this player from either side
  socket.on("undecided", function(obj) {
    if (socket.id != null) {
      if (!gameState.current_debate) return;
      let index_a = gameState.current_debate.A.indexOf(socket.id);
      if (index_a >= 0) {
        gameState.current_debate.A.splice(index_a, 1);
      }
      let index_b = gameState.current_debate.B.indexOf(socket.id);
      if (index_b >= 0) {
        gameState.current_debate.B.splice(index_b, 1);
      }
    }
  });

  // On a lean_towards_a message, add them to the A side
  socket.on("lean_towards_a", function(obj) {
    if (socket.id != null) {
      if (!gameState.current_debate) return;
      let index_a = gameState.current_debate.A.indexOf(socket.id);
      if (index_a < 0) {
        gameState.current_debate.A.push(socket.id);
        // Then also remove from B, if necessary
        let index_b = gameState.current_debate.B.indexOf(socket.id);
        if (index_b >= 0) {
          gameState.current_debate.B.splice(index_b, 1);
        }
        try_resolve();
      }
    }
  });

  // On a lean_towards_b message, add them to the B side
  socket.on("lean_towards_b", function(obj) {
    if (socket.id != null) {
      if (!gameState.current_debate) return;
      let index_b = gameState.current_debate.B.indexOf(socket.id);
      if (index_b < 0) {
        gameState.current_debate.B.push(socket.id);
        // Then also remove from A, if necessary
        let index_a = gameState.current_debate.A.indexOf(socket.id);
        if (index_a >= 0) {
          gameState.current_debate.A.splice(index_a, 1);
        }
        try_resolve();
      }
    }
  });

  // socket.on("new_question_w_one_debator", function(obj) {
  //   if (socket.id != null) {
  //     obj.contributors.push(socket.id);
  //     obj.owner = null;
  //     gameState.players[socket.id].questions_w_one_debator = [];
  //     gameState.questions_w_one_debator.push(obj);
  //     try_to_distribute();
  //   }
  // });

  // socket.on("new_question_w_both_debators", function(obj) {
  //   if (socket.id != null) {
  //     obj.contributors.push(socket.id);
  //     obj.owner = null;
  //     gameState.players[socket.id].questions_w_two_debator = [];
  //     gameState.questions_w_two_debator.push(obj);
  //     try_to_distribute();
  //   }
  // });

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


// Decrement the gameState.debate_timer and reset the current_debate if it ends
// setInterval(function() {
//   // TODO 
// }, 1000);


// Check if the current_debate can be resolved
function try_resolve() {
  if (!gameState.current_debate) return;
  // Debate ends if everyone is on the same side
  let total_players = Object.keys(gameState.players).length;
  let A_won = (gameState.current_debate.A.length == total_players);
  let B_won = (gameState.current_debate.B.length == total_players);
  if (!A_won && !B_won) return;

  // Find the current debate in the questions_w_two_stance array and delete it
  for (let q_index = 0; q_index < gameState.questions_w_two_stance.length; q_index++) {
    let q = gameState.questions_w_two_stance[q_index];
    if (q.is_current_debate) {
      gameState.questions_w_two_stance.splice(q_index, 1);
      break;
    }
  }
  gameState.current_debate = null;
}


// Iterates over all the current questions and tries to distribute any that aren't owned
function try_to_distribute() {
  // Distribute open_questions
  for (let q of gameState.open_questions) {
    if (q.owner) continue;
    for (let socketID in gameState.players) {
      let player = gameState.players[socketID];
      if (player.open_questions.length > 0) continue;
      if (q.contributors.includes(socketID)) continue;
      q.owner = socketID;
      player.open_questions.push(q);
      break;
    }
  }
  // Distribute questions_w_one_stance
  for (let q of gameState.questions_w_one_stance) {
    if (q.owner) continue;
    for (let socketID in gameState.players) {
      let player = gameState.players[socketID];
      if (player.questions_w_one_stance.length > 0) continue;
      if (q.contributors.includes(socketID)) continue;
      q.owner = socketID;
      player.questions_w_one_stance.push(q);
      break;
    }
  }
  // Distribute questions_w_two_stance
  for (let q of gameState.questions_w_two_stance) {
    if (q.owners && q.owners.length >= 2) continue;
    for (let socketID in gameState.players) {
      let player = gameState.players[socketID];
      if (player.questions_w_two_stance.length > 0) continue;
      if (q.contributors.includes(socketID)) continue;
      q.owners.push(socketID);
      player.questions_w_two_stance.push(q);
      break;
    }
  }
  // Determine if there should be a new current_debate
  if (!gameState.current_debate) {
    for (let q of gameState.questions_w_two_stance) {
      if (q.owners && q.owners.length >= 2) {
        q.A = [];
        q.B = [];
        q.is_current_debate = true;
        gameState.current_debate = q;
        return;
      }
    }
  }

  // for (let q of gameState.questions_w_one_debator) {
  //   if (q.owner) continue;
  //   for (let socketID in gameState.players) {
  //     let player = gameState.players[socketID];
  //     if (player.questions_w_one_debator.length > 0) continue;
  //     if (q.contributors.includes(socketID)) continue;
  //     q.owner = socketID;
  //     player.questions_w_one_debator.push(q);
  //     break;
  //   }
  // }
  // for (let q of gameState.questions_w_two_debator) {
  //   if (q.owner) continue;
  //   for (let socketID in gameState.players) {
  //     let player = gameState.players[socketID];
  //     if (player.questions_w_two_debator.length > 0) continue;
  //     if (q.contributors.includes(socketID)) continue;
  //     q.owner = socketID;
  //     player.questions_w_two_debator.push(q);
  //     break;
  //   }
  // }
}
