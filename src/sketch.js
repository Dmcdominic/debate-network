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
var num_players;
var input, input2, input3, input4;
var prompt, prompt2, prompt3, prompt4;
var button, button2, button3, button4, buttonU, buttonA, buttonB;
var greeting4;



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

  // ----- Canvas setup -----
  //let c = createCanvas(displayWidth, displayHeight);
  let c = createCanvas(windowWidth, windowHeight);
  c.position(0, 0);
  
  let y_offset = 5;

  // Title
  let greeting = createElement('h1', 'DEBATE NETWORK');
  greeting.position(20, y_offset);
  y_offset += 60;

  num_players = createElement('h4', 'Current players: 1?');
  num_players.position(40, y_offset);
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
  greeting4 = createElement('h2', 'Debate:');
  greeting4.position(20, y_offset);
  y_offset += 40;

  prompt4 = createElement('h3', '<i>(waiting for question)</i>');
  prompt4.position(20, y_offset);
  y_offset += 60;

  buttonU = createButton('undecided');
  buttonU.position(20, y_offset);
  buttonU.mousePressed(undecided);
  y_offset += 20;

  promptA = createElement('h3', '<i>(waiting for stance)</i>');
  promptA.position(20, y_offset);
  y_offset += 40;

  buttonA = createButton('lean towards A');
  buttonA.position(20, y_offset);
  buttonA.mousePressed(lean_towards_a);
  y_offset += 20;

  promptB = createElement('h3', '<i>(waiting for stance)</i>');
  promptB.position(20, y_offset);
  y_offset += 40;

  buttonB = createButton('lean towards B');
  buttonB.position(20, y_offset);
  buttonB.mousePressed(lean_towards_b);
  y_offset += 40;
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

function undecided() {
  if (!saved_state.current_debate) return;
  socket.emit("undecided", {});
}

function lean_towards_a() {
  if (!saved_state.current_debate) return;
  socket.emit("lean_towards_a", {});
}

function lean_towards_b() {
  if (!saved_state.current_debate) return;
  socket.emit("lean_towards_b", {});
}


// Updates the text of each prompt
function update_prompts() {
  if (!saved_state) return;
  // Update the number of players
  let total_num_players = Object.keys(saved_state.players).length;
  num_players.html('Current players: ' + total_num_players);
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
  // check current_debate
  prompt4.html('<i>(waiting for question)</i>');
  if (saved_state.current_debate) {
    let q = saved_state.current_debate;
    prompt4.html('The question: <i>' + q.question + '</i>');
    if (q.owners.includes(socket.id)) {
      greeting4.html('Debate your given stance for this question:');
      if (q.owners[0] == socket.id) {
        promptA.html('YOUR stance: <i>' + q.stances[0] + '</i>');
        promptB.html('OPPOSING stance: <i>' + q.stances[1] + '</i>');
      } else {
        promptA.html('OPPOSING stance: <i>' + q.stances[0] + '</i>');
        promptB.html('YOUR stance: <i>' + q.stances[1] + '</i>');
      }
    } else {
      greeting4.html('During the debate, update which side you lean towards:');
      promptA.html('Stance A: <i>' + q.stances[0] + '</i>');
      promptB.html('Stance B: <i>' + q.stances[1] + '</i>');
    }
    // Update button text
    let total_A = saved_state.current_debate.A.length;
    let total_B = saved_state.current_debate.B.length;
    let total_U = Object.keys(saved_state.players).length - total_A - total_B;

    let in_A = false;
    let index_a = saved_state.current_debate.A.indexOf(socket.id);
    if (index_a >= 0) {
      in_A = true;
    }
    let in_B = false;
    let index_b = saved_state.current_debate.B.indexOf(socket.id);
    if (index_b >= 0) {
      in_B = true;
    }

    buttonU.html('undecided (' + total_U + ')' + ((in_A || in_B) ? '' : ' [YOU]'));
    buttonA.html('lean towards A (' + total_A + ')' + ((!in_A) ? '' : ' [YOU]'));
    buttonB.html('lean towards B (' + total_B + ')' + ((!in_B) ? '' : ' [YOU]'));
  } else {
    greeting4.html('Debate:');
    prompt4.html('<i>(waiting for question)</i>');
    promptA.html('<i>(waiting for stance)</i>');
    promptB.html('<i>(waiting for stance)</i>');
    buttonU.html('undecided');
    buttonA.html('lean towards A');
    buttonB.html('lean towards B');
  }
  // for (let q of saved_state.questions_w_two_stance) {
  //   if (q.owners.includes(socket.id)) {
  //     let prompt_str = 'The question: <i>' + q.question + '</i><br>';
  //     if (q.owners[0] == socket.id) {
  //       prompt_str += 'YOUR stance: <i>' + q.stances[0] + '</i><br>OPPOSING stance: <i>' + q.stances[1] + '</i>';
  //     } else {
  //       prompt_str += 'YOUR stance: <i>' + q.stances[1] + '</i><br>OPPOSING stance: <i>' + q.stances[0] + '</i>';
  //     }
  //     prompt4.html(prompt_str);
  //     break;
  //   }
  // }
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
