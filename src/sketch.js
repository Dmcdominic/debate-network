/// <reference path="TSDef/p5.global-mode.d.ts" />

/* sketch.js and associated src/ files based on i-am-not-alone - https://github.com/Streakman/i-am-not-alone */
/* i-am-not-alone based on this project - https://editor.p5js.org/kaganatalay/sketches/vFlDyAsEC */

// NETWORKING - based on Paolo's mouses code - https://github.com/molleindustria/mouses

//create a socket connection
var socket;
//I send updates at the same rate as the server update
// var UPDATE_TIME = 1000 / 3;

// The current state of the game
var saved_state;

// input elements
var input, input2, input3, input4, input5;
var prompt, prompt2, prompt3, prompt4, prompt5;
var button, button2, button3, button4, button5;



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
  // setInterval(function() {
  //   // TODO - update this with some other state data? Or don't send until you've typed/submitted something
  //   socket.emit("clientUpdate", {
  //   });
  // }, UPDATE_TIME);

  // ----- Canvas setup -----
  //let c = createCanvas(displayWidth, displayHeight);
  let c = createCanvas(windowWidth, windowHeight);
  c.position(0, 0);
  
  let y_offset = 5;

  // Title
  let greeting = createElement('h1', 'DEBATE NETWORK');
  greeting.position(20, y_offset);
  y_offset += 60;

  // Set up "new question" input field
  greeting = createElement('h2', 'Enter a question:');
  greeting.position(20, y_offset);
  y_offset += 60;

  input = createInput();
  input.position(20, y_offset);

  button = createButton('submit');
  button.position(input.x + input.width, y_offset);
  button.mousePressed(on_submit);
  y_offset += 90;
  
  // Set up "first stance" input field
  greeting = createElement('h2', 'Enter a stance:');
  greeting.position(20, y_offset);
  y_offset += 40;

  prompt2 = createElement('h3', '<i>(waiting for question)</i>');
  prompt2.position(20, y_offset);
  y_offset += 60;

  input2 = createInput();
  input2.position(20, y_offset);

  button2 = createButton('submit');
  button2.position(input.x + input.width, y_offset);
  button2.mousePressed(on_submit2);

  y_offset += 90;
  
  // Set up "second stance" input field
  greeting = createElement('h2', 'Enter an opposing stance:');
  greeting.position(20, y_offset);
  y_offset += 40;

  prompt3 = createElement('h3', '<i>(waiting for question)</i>');
  prompt3.position(20, y_offset);
  y_offset += 60;

  input3 = createInput();
  input3.position(20, y_offset);

  button3 = createButton('submit');
  button3.position(input.x + input.width, y_offset);
  button3.mousePressed(on_submit3);

  y_offset += 90;
  
  // Set up "you are debating" input field
  greeting = createElement('h2', 'Debate your given stance for this question:');
  greeting.position(20, y_offset);
  y_offset += 40;

  prompt4 = createElement('h3', '<i>(waiting for question)</i>');
  prompt4.position(20, y_offset);
  y_offset += 60;
}


// Called every frame to draw to the screen
function draw() {
}


// Called when the "submit" button is pressed
function on_submit() {
  let text_in = input.value();
  input.value('');
  // Send the input to the server
  socket.emit("new_open_question", {
    question: text_in
  });
}

function on_submit2() {
  let text_in = input2.value();
  input2.value('');
  // If there's a corresponding question, send it (with the new stance) to the server
  for (let q of saved_state.open_questions) {
    if (q.owner == socket.id) {
      q.stances = [ text_in ];
      socket.emit("new_question_w_one_stance", q);
      q.owner = null;
      break;
    }
  }
}

function on_submit3() {
  let text_in = input3.value();
  input3.value('');
  // If there's a corresponding question, send it (with the new stance) to the server
  for (let q of saved_state.questions_w_one_stance) {
    if (q.owner == socket.id) {
      q.stances.push(text_in);
      socket.emit("new_question_w_two_stance", q);
      q.owner = null;
      break;
    }
  }
}


// Updates the text of each prompt
function update_prompts() {
  if (!saved_state) return;
  // check open_questions
  prompt2.html('<i>(waiting for question)</i>');
  for (let q of saved_state.open_questions) {
    if (q.owner == socket.id) {
      prompt2.html('The question: <i>' + q.question + '</i>');
      break;
    }
  }
  // check questions_w_one_stance
  prompt3.html('<i>(waiting for question)</i>');
  for (let q of saved_state.questions_w_one_stance) {
    if (q.owner == socket.id) {
      prompt3.html('The question: <i>' + q.question + '</i><br>The first stance: <i>' + q.stances[0] + '</i>');
      break;
    }
  }
  // check questions_w_two_stance
  prompt4.html('<i>(waiting for question)</i>');
  for (let q of saved_state.questions_w_two_stance) {
    if (q.owners.includes(socket.id)) {
      let prompt_str = 'The question: <i>' + q.question + '</i><br>';
      if (q.owners[0] == socket.id) {
        prompt_str += 'YOUR stance: <i>' + q.stances[0] + '</i><br>OPPOSING stance: <i>' + q.stances[1] + '</i>';
      } else {
        prompt_str += 'YOUR stance: <i>' + q.stances[1] + '</i><br>OPPOSING stance: <i>' + q.stances[0] + '</i>';
      }
      prompt4.html(prompt_str);
      break;
    }
  }
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
    update_prompts();
  }
}

//called by the server every 30 fps
function updateState(state) {
  // console.log("state message received! (my socket.id: " + socket.id + ")");
  // console.log(state);
  saved_state = state;
  update_prompts();
}
