/// <reference path="TSDef/p5.global-mode.d.ts" />

/* sketch.js and associated src/ files based on i-am-not-alone - https://github.com/Streakman/i-am-not-alone */
/* i-am-not-alone based on this project - https://editor.p5js.org/kaganatalay/sketches/vFlDyAsEC */

// NETWORKING - based on Paolo's mouses code - https://github.com/molleindustria/mouses

//create a socket connection
var socket;
//I send updates at the same rate as the server update
var UPDATE_TIME = 1000 / 3;

// The current state of the game
var saved_state;

// input elements
var input;



// ----- p5.js functions -----

function preload() {
}


function setup() {
  // ----- Networking Setup -----
  //I create socket but I wait to assign all the functions before opening a connection
  socket = io({
    autoConnect: false
  });

  //detects a server connection
  socket.on("connect", onConnect);
  //handles the messages from the server, the parameter is a string
  socket.on("message", onMessage);
  //handles the user action broadcast by the server, the parameter is an object
  socket.on("state", updateState);

  socket.open();

  //every x time I update the server on my position
  setInterval(function() {
    // TODO - update this with some other state data? Or don't send until you've typed/submitted something
    socket.emit("clientUpdate", {
    });
  }, UPDATE_TIME);

  // ----- Canvas setup -----
  //let c = createCanvas(displayWidth, displayHeight);
  let c = createCanvas(windowWidth, windowHeight);
  c.position(0, 0);
  
  // Set up input field
  input = createInput();
  input.position(20, 65);

  let button = createButton('submit');
  button.position(input.x + input.width, 65);
  button.mousePressed(on_submit);

  let greeting = createElement('h2', 'Enter a question:');
  greeting.position(20, 5);

  textAlign(CENTER);
  textSize(50);
}


// Called every frame to draw to the screen
function draw() {
  // TODO - write text
  // push();
  // fill(100, 100, 100, 255);
  // translate(width / 2, height / 2);
  // textSize(64);
  // textAlign(CENTER, CENTER);
  // text("Press any key to start", 0, 0);
  // pop();
}


// Called when the "submit" button is pressed
function on_submit() {
  let text_in = input.value();
  // TODO - use the input value
  input.value('');
}


// Key input functions
function keyPressed(event) {
}

function keyReleased() {
}

function mousePressed() {
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


// ----- NETWORKING LISTENERS -----

//connected to the server
function onConnect() {
  if (socket.id) {
    console.log("Connected to the server");
    socket.emit("newPlayer", {
    });
  }
}

//a message from the server
function onMessage(msg) {
  if (socket.id) {
    console.log("Message from server: " + msg);
  }
}

//called by the server every 30 fps
function updateState(state) {
  // console.log("state message received! (my socket.id: " + socket.id + ")");
  // console.log(state);
  saved_state = state;
}
