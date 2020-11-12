/// <reference path="TSDef/p5.global-mode.d.ts" />

// NETWORKING - based on Paolo's mouses code - https://github.com/molleindustria/mouses

//create a socket connection
var socket;
var pointer;
//I send updates at the same rate as the server update
var UPDATE_TIME = 1000 / 3;

/* sketch.js and associated src/ files based on this project - https://editor.p5js.org/kaganatalay/sketches/vFlDyAsEC */

let environment;

let background_image;
let colliders_image;
let outdoor_image;
let oudoor_colliders_image;
let noise_image;
let wall_vent_image;
let wall_vent_backImg;

let click_to_start = true;

let audioEnabled = false;
let sound = {
  ambience: null,
  darkness: null
};


let genericCollider;
let nongenericCollider;
var player_sprite_sheet;
var player_animation;
var player_anim1;
var player_anim2;
var player_anim3;

function preload() {
  //background art goes here...
  background_image = loadImage(
    "Assets/Map_OfficeBackground.jpg"
  );
  colliders_image = loadImage(
    "Assets/NewOfficeColliders.png"
  );
  outdoor_image = loadImage("Assets/Outdoor Background.png");
  outdoor_colliders_image = loadImage("Assets/Outdoor Colliders.png");
  noise_image = loadImage(
    "Assets/VFX_noise large.png"
  );
  wall_vent_image = loadImage(
    "Assets/portal.png"
  );
  wall_vent_backImg = loadImage(
    "Assets/portal_collider.png"
  );
  genericCollider = loadImage("Assets/Mesh_GenericCollider.png"); //50 X 50
  nongenericCollider = loadImage("Assets/Mesh_GenericCollider2.png"); 
  //sounds
  sound.ambience = loadSound(
    "Assets/Audio/Soft-ambient-background-music.mp3"
  );
  sound.darkness = loadSound(
    "Assets/Audio/Hor Hor.mp3"
  );

  // Character sprites
  charSprite = loadImage(
    "Assets/VFX_officePhone.png" //Placeholder
  );

  // Spritesheet resources/examples
  //  https://molleindustria.github.io/p5.play/docs/classes/SpriteSheet.html
  //  https://molleindustria.github.io/p5.play/examples/index.html?fileName=sprites_with_sheet.js
  //  http://molleindustria.github.io/p5.play/examples/index.html
  //Assets/SpriteAnims/avatar1/
  loadJSON("Assets/SpriteAnims/avatar1/spritesheet.json", function(player_frames) {
    player_spiteSheet1 = loadSpriteSheet("Assets/SpriteAnims/avatar1/spritesheet.png", player_frames.frames);
    player_anim1 = loadAnimation(player_spiteSheet1);
  });
  loadJSON("Assets/SpriteAnims/avatar1/spritesheet.json", function(player_frames) {
    player_spiteSheet2 = loadSpriteSheet("Assets/SpriteAnims/avatar2/spritesheet.png", player_frames.frames);
    player_anim2 = loadAnimation(player_spiteSheet2);
  });
  loadJSON("Assets/SpriteAnims/avatar1/spritesheet.json", function(player_frames) {
    player_spiteSheet3 = loadSpriteSheet("Assets/SpriteAnims/avatar3/spritesheet.png", player_frames.frames);
    player_anim3 = loadAnimation(player_spiteSheet3);
  });
  player_anims = [player_anim1, player_anim2,player_anim3];

  loadJSON("Assets/SpriteAnims/cube/spritesheet.json", function(cubical_frames) {
    cubical_spiteSheet = loadSpriteSheet("Assets/SpriteAnims/cube/spritesheet.png", cubical_frames.frames);
    cubical_anim = loadAnimation(cubical_spiteSheet);
  });

  loadJSON("Assets/SpriteAnims/house/spritesheet.json", function(house_frames) {
    house_spritesheet = loadSpriteSheet("Assets/SpriteAnims/house/spritesheet.png", house_frames.frames);
    house_anim = loadAnimation(house_spritesheet);
  });
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
    socket.emit("clientUpdate", {
      x: environment.player.position.x,
      y: environment.player.position.y
    });
  }, UPDATE_TIME);

  // ----- Canvas setup -----
  //let c = createCanvas(displayWidth, displayHeight);
  let c = createCanvas(windowWidth, windowHeight);
  c.position(0, 0);
  environment = new Environment(
    background_image,
    colliders_image,
    outdoor_image,
    outdoor_colliders_image,
    socket,
    player_anim1,
    player_anim2,
    player_anim3,
    wall_vent_image,
    wall_vent_backImg,
    genericCollider,
    nongenericCollider,
    cubical_anim,
    house_anim //replace with another sprite animation if you want...
  );
  //3464,
  //2474
  
  environment.makeSprites(
    1,
    -1830, //x
    -935, //y
    20, //cubicals
    5, //rows
    450, //y offset between rows
    185, //x offset between sprites
    10 //sprites till gap
  );

  environment.makeSprites(
    0,
    -1830, //x
    -2800, //y
    9, //Houses
    4, //rows
    400, //y offset between rows
    500, //x offset between sprites
    2 //sprites till gap
  );

  // Initialize the office lines
  for (let i=0; i < current_office_lines.length; i++) {
    current_office_lines[i] = Math.floor(random() * OFFICE_LINES.length);
  }

  // Audio to start before you press any key
  getAudioContext().suspend();
}

// Called when a key is pressed so things should get started
function pressedToStart() {
  click_to_start = false;

  // ----- Play audio -----
  //   reference - https://p5js.org/reference/#/p5/userStartAudio
  userStartAudio(null, function() {
    // Error occuring here sometimes, seems to be resolved in a future relaase of p5 sound
    //   https://github.com/processing/p5.js-sound/issues/506
    masterVolume(0.7);
    sound.ambience.setLoop(true);
    sound.ambience.setVolume(1);
    sound.darkness.setLoop(true);
    sound.darkness.setVolume(0);
    audioEnabled = true;
    try {
      sound.ambience.play();
      sound.darkness.play();
    } catch (err) {
      console.log("Caught error while trying to play audio:");
      console.log(err);
    }
  });
}

// Called every frame to draw to the screen
function draw() {
  background(0);
  if (click_to_start) {
    drawStartScreen();
  } else {
    environment.start();

    // TODO - use this for each office desk in the environment

    // Dom's custom color stuff
    drawColorWaves();
    //get player pixel position 
    // createRectangleAtPixel();
    
    //cube_test.animation.play();
  }
}


// Key input functions
function keyPressed(event) {
  if (click_to_start) pressedToStart();
  if (!environment?.player?.controls) return;
  for (let i = 0; i < environment.player.controls.length; i++) {
    if (
      key == environment.player.controls[i] ||
      keyCode == environment.player.altControls[i]
    ) {
      environment.player.movement[i] = true;
    }
  }
}

function keyReleased() {
  if (!environment?.player?.controls) return;
  for (let i = 0; i < environment.player.controls.length; i++) {
    if (
      key == environment.player.controls[i] ||
      keyCode == environment.player.altControls[i]
    ) {
      environment.player.movement[i] = false;
    }
  }
}

function mousePressed() {
  if (click_to_start) pressedToStart();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Draw the "press any key to start" screen
function drawStartScreen() {
  push();
  fill(100, 100, 100, 255);
  translate(width / 2, height / 2);
  textSize(64);
  textAlign(CENTER, CENTER);
  text("Press any key to start", 0, 0);
  pop();
}

// Dom's custom color stuff
let cycleTimer = 0;

const SHAPE_INSTANCES = 20;
const PETALS = 1;

const PERIOD = 27; // in seconds
const PERIOD_MS = PERIOD * 1000;

const MIN_DIST_SQRD = 50 * 50;
const MAX_DIST_SQRD = 800 * 800;

// The OFFICE_LINES themselves are stored at the bottom of this script
var current_office_lines = new Array(SHAPE_INSTANCES);

function drawColorWaves() {
  cycleTimer += deltaTime;

  push(); // Start a new drawing state
  // strokeWeight(1);
  noStroke();
  // fill('#0061c266');
  fill(20, 20, 20, 100);
  // translate(50, 0);

  // Determine how close the closest player is, for alpha_scale purposes
  let closest_dist_sqrd = 2 * MAX_DIST_SQRD; // Very large number
  let alpha_scale = 0;
  if (environment.saved_state) {
    for (let playerId in environment.saved_state.players) {
      if (environment.saved_state.players.hasOwnProperty(playerId)) {
        //in this case I don't have to draw the pointer at my own position
        if (playerId != environment.socket.id) {
          let playerState = environment.saved_state.players[playerId];

          //draw a pointer image for each player except for myself
          // image(pointer, playerState.x + i * 5, playerState.y + i * 3);
          // temp player drawing
          let dist_x = environment.player.position.x - playerState.x;
          let dist_y = environment.player.position.y - playerState.y;
          let dist_sqrd = dist_x * dist_x + dist_y * dist_y;
          closest_dist_sqrd = min(dist_sqrd, closest_dist_sqrd);
        }
      }
    }
    if (closest_dist_sqrd < MAX_DIST_SQRD) {
      alpha_scale =
        (MAX_DIST_SQRD - closest_dist_sqrd) / (MAX_DIST_SQRD - MIN_DIST_SQRD);
    }
  }

  // Update sounds
  if (audioEnabled) {
    sound.ambience.setVolume(alpha_scale);
    sound.darkness.setVolume(1 - alpha_scale);
    try {
      if (!sound.ambience.isPlaying()) sound.ambience.play();
      if (!sound.darkness.isPlaying()) sound.darkness.play();
    } catch (err) {
      console.log("Caught error while trying to play audio:");
      console.log(err);
    }
  }

  // Change one random office line
  current_office_lines[Math.floor(random() * current_office_lines.length)] = Math.floor(random() * OFFICE_LINES.length);

  // Draw flowers
  textSize(24);
  textAlign(CENTER, CENTER);
  for (let i = 0; i < SHAPE_INSTANCES; i++) {
    let t = cycleTimer - (i * PERIOD_MS) / SHAPE_INSTANCES;
    let cycleRad = ((t % PERIOD_MS) / PERIOD_MS) * 2 * Math.PI;
    let sin = Math.sin(cycleRad);
    let cos = Math.cos(cycleRad);
    fill(20, 20, 20, 255 * alpha_scale * sin * cos);
    // flower
    push();
    let x = width / 2 + (cos * width) / 2;
    let y = height / 2 + (sin * height) / 2;
    translate(x, y);
    rotate(i);
    text(OFFICE_LINES[current_office_lines[i]][Math.floor(random()*3 + 1)], 0, 0);
    // for (let i = 0; i < PETALS; i++) {
    //   rotate((PI * 2) / PETALS + random());
    //   fill(
    //     random() * 255,
    //     random() * 255,
    //     random() * 255,
    //     alpha_scale * sin * cos * 255
    //   );
    //   ellipse(0, 0, 20, 80);
    // }
    pop();
  }

  pop(); // Restore original state

  // Visual noise
  push();
  imageMode(CENTER);
  tint(255, (1 - alpha_scale) * 25);
  let x = width / 2 + ((random() * 2 - 1) * width) / 3;
  let y = height / 2 + ((random() * 2 - 1) * width) / 3;
  image(noise_image, x, y, noise_image.width * 12, noise_image.height * 12);
  pop();
}

// ----- Pixel Collisions -----

function getPlayerPixelPos() {
  //take plater pos, add half width, half height (position relative to top left)/scale = pixel position x,y
  var pixelX =
    environment.player.position.x / environment.scale +
    environment.resolution * 0.5;
  var pixelY =
    environment.player.position.y / environment.scale +
    environment.resolution * 0.5;
  pixelX = floor(pixelX);
  pixelY = floor(pixelY);
  var coords = [pixelX, pixelY];
  return coords;
}

function createRectangleAtPixel() {
  var X = floor(width / 2 + environment.player.radius + 20);
  var Y = floor(height / 2);
  var color = get(X, Y);
  fill(color);

  rect(X, Y, 50, 50);
}

// ----- NETWORKING LISTENERS -----

//connected to the server
function onConnect() {
  if (socket.id) {
    console.log("Connected to the server");
    socket.emit("newPlayer", {
      x: environment.player.position.x,
      y: environment.player.position.y
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
  environment.saved_state = state;
}


// ----- OFFICE LINES -----
const OFFICE_LINES = [
  [
    "Mondays, amiright?",
    "M̵̧̛̬̃o̸̦̓͌n̶̹̦͐d̶̞͖̈́ȁ̴̧͙́y̵͍̣͋ś̷̩͑,̸̬̑ ̸̱́̊ͅḁ̷͈͒̕m̵̛͉̪í̵̬r̵̩̝̄̇i̸̢̡̋̆ģ̶͐h̸̩͋͆t̴̍͜?̴̛͈̞̽",
    "Ṃ̸̡̰͈͎̘̰͓̻̼͇̳̖̗̱͈̬̹̫̈̀̂̉́͗͐͗̃̕o̴̼̪̙̖͎̔̉͌͜n̵͙͓̜̳̿̏̍̇̓̑́̋̕ḏ̵̢̨̨̫̤͚͓͇̯̱̼̪͐́͆͑̽̓̅̇́͑͂͂́́̅͋̃a̵̯͇̓͛̌̽̀̋̈̽̀̎̋̇̚͠y̵̢̖̣͚̮͎̙̘͚̘̩̰͔̪̙̲̹̥͓̍͋̇́̚͜͝s̸̢̖̜̖̖̫͓̟̻̄̀̈̓̽͊̊̎̊͐́̍̅͝͠,̴̡̢̨̛̱̣͇̗̼̻̼̘͖͓͈̲͙̯̄̈́̇͐̅̽̾̉̐̓͘͜ ̵̛͇͍͇̙͍̖̣̿͒͛͐̉̽̆͋̄͒͂͌͝á̷̗̙̯̇̈̉̓̃̓̃͑̂̕͠͠m̵̨̞̬͓͉̮̰̘̲͇̮̻̬͇̪͙̲͎̘̓͌͂̇̌̌͒̍̂̒̃͒̍͊̐͝͠ͅï̸̧̢̭͈̜͍͓̯͕̼͎̩͈̜̼̻̬̯̏̐̉͒̈́̀̏͗͛̈́͒̾͑̓̇͘r̶̛͍̘̞̯̗̻̤̪̹̼̱̫̍͆̽̊͐͆̐͋̂͘͝͝î̴͖͆g̵̛̘̩̗̣͍̩̙̯͚̿̿̎̈́͌̃̈́͘͠͝͠ͅḩ̶̛̞͔̝̺̘̪͇̪͎̹̟̉̈́̉̾́̓́̄̽͋́̈́̍̕͘͝͝ͅt̴͔͇̯͔̰͕̱̳̺̞́̉̾̎̅̂̕͝͝ͅ?̸̻̹̱̈́̌̈̈́̏̈́̈́͜͝͝͝",
    "M̴͈͗̈́͋́͆̚̚͝ő̵̹͚͙̂̀̿͐͂ṉ̵͗͌̑͒̍͑͌̕ḑ̷̝̞͍͎̩̈́̾͛͋̚a̴͙̜͇̱̻̐̑̈́͌̍̚y̴̧̤̣͋̃̈́̂̕͝s̷̡̬͕̳͈͍̱̯̈́̀,̶̛̻͈͛͛͐͒ ̸̼̪̭̆̄͊̈́̈́͊̃á̴͕͖̀͋̾̋̕m̵̱͔̗̪̞̋̌̌̌͘i̷̼̭̣̬̻͔͛̓r̵̢̡̲͘ĩ̵̮̖̦̥͑͌̃͗̾̚g̶̙̫̼̗̙̹̾̔͊͒̐͘h̸̢͙͔̔̒̓͝t̵͉͓̞̰̼͆́̉͘ͅͅ?̸̛͔̳̒̑͌̎̓̇"
  ],
  [
    "Here comes Mike",
    "Ḩ̵̢̛̥͈̗͚̣̚e̶̖̱̅̏̎̀̽́̕r̶̗̔̇e̸͚͜͠ ̴̜̞̺͇̬̔̾̇͑̚c̵͎̤͇̪̐̆̅̓̚͜͝͝o̴̢̼͈̹̲͓̍̒͗m̸̧̪͙̲̲͚̱͉͐e̴͉̒͗̉͑͂͘̚͜s̵͓͐͘ ̸̯̲̱̟̤̮̙̃̐̔̊͜͝M̴̝̔̂̈́̕i̵̦̝͓̭̾̓̑̐͂͜ͅk̶̢͕̣̪̒͌́̓͋ē̸̞͈̤̊͑̀̀͆",
    "H̶̗̞̘͙́͝ȩ̶̜̗̌r̷̗͋́̑̊͋ẽ̷͈͑͌͆̉͜ ̴̡̲̞̫͂̔̾̾c̷̢̠̭̤̏̋͘ͅõ̵̫̬͖͈͚̂̍̏m̷̢̘̉̊̄̇e̵̢̛͕̖̻͊̓s̸̹͎͖͕̎̇̀ ̴̢̪̥̐̐M̶̢̳̗̪̎͛̈͊i̷̥͖͒͂̈̍͑ͅk̶̡̤͖͕̳̃̐́e̴̘̍̏̚",
    "H̷̨̧͕͙͖̜̻̞̮̪̦̱̻̹̗̩͋̏͌̀͊̂̈͂̋͋̕͝͝͠͝ͅͅẻ̵̡̛͈͍̒̀̈̚̕͝r̴̨̞̗̜̖̝̩͖͆͌̉̈̍͗̒̿̽̈́̐ẹ̴̡̝̙̯̣̫̗̿̍̑͒̈́́̽̒͜͝ ̷̢̡̟̺̼̙̠̲̼̫͖͓̰̫̟̹̗̊̋̒̏́͒̾͒̇̚c̴̛̬̞͇̗͎͎̓̽͐͂̾͊̉͜ơ̶̛̜̫͍̥̱̌̅̆̆͛͌̀̅̑̄͒͘͜͝m̵̨͛͒͊̃̀̾ê̸͈̩͉̙̗̝̭͖̑͂̋̈́̚s̷̻̜̞̲̈̄̓̍̓̀̚̕̚͜͝ ̷̢̢̳̮͙̥̣̝̟͖̈́͆͋͐͘͘̚M̸̡̬̙̺̣̞̟̺̖̤͛̓͑̈̈́̓͂̀̃̿̇͌̿̓͊̚͜͜i̸̱͍͙̪͇̝͉͚̍̐͌́̑̂̀k̸̨̳͕̩͈͖̻͙̱͇̗̻̖̝̩̠̉̅̔̓͑͜ē̵̜͕͍"
  ],
  [
    "Here comes Ebony",
    "H̸̛̦̹̎͛̓̌͋̋̉͂̂̊̕͠͠e̸̛͕̝͆̽̑̎͂͆͠ŗ̸͕̺͎̺̪̬̺͍̦̦̝̗̦̙̪͍̰̓̅̋̀͗͑̀̊̽̚ẻ̵̫͉͎̻̯̺̙̗̖̼̗̹̌̀̐̕̚ͅ ̷̜͈̭̈́́ͅc̴̖̮̭͗ö̸̮̠͈̝͖͇͎̥̯͙͎̝̻͇̥̘͍́͗̄̋̄̆͝m̸̯̻̭̟̲͈̟͔̪̩̮̜͎̊̓̈́͗̍e̴̡̨̥̮̣̰̖͎̰͎̹̟̖̞͉̟̐̄̎̅̃̌͝͝s̸̛͉̥͇̰͔̝̺̜̈́̾̐͒͛̀̈́̀͜͝͠ ̴̻̲̣̮̺̘̜̍̈́̈̒͐̃̒̂̐̂̓́͊̕͘͝͝Ȅ̴̢̧̧̢̢̛̗͈̯̹̙̭̞̟̜̠̖̾̐̓̓̇́͊̓̿̒̊̌̐͝ͅb̷̧̧̛̥̯̝̠̓̉̉̅̓͒̎̓͌̃̾ô̷̡̧̢̮̝̠̦̝̼̗͉̱̺͉̅͊̈̏̍̀͂́̉̍̊͌̌͘͜n̴̨̛͔̖̟͙̥̱̝̤̾̇̍̎̈́̾͑͂͂̈́̏̿̓͠y̵̡̹͚͖͇̲͌̀̃̒͆̈̈́̅̔̉̋̃͛̀̓̕͝",
    "H̸̱͚̠̺̭͗̓̂̚ẻ̵̘̠̙̜͉͎̟͍̊͝r̸͖̠̤̻͖̟̊͒̓̈̄͑̚ě̴̢̗̝͍ ̴̢̛̭̻̻̘̾͒͋̂̉̃c̷̡̐͒̕͝o̸̹͇̲̭̤̽͛̍͑̏̑̀ͅm̶̨̛̫͇̻͔̙̩͔̎̃̍̇̆͗e̷̺͕̠͓̖̾̿̏̓͛̚̚͝s̴̝̺̀̌͌̿̈͝ ̷̛͓̟̟̹́̏̕E̸̖̪̩͔̙͍̍̇b̴̗̗̭͈͍̀́̇́͗͠͝o̷̗̼̼͆n̷̯̈ỹ̸̢̝̙̗̳͚",
    "H̴̨̙̟͔̲̄̑̿ĕ̴̺̝̄̀͝r̵̲̲̭̀͋̃͝͠ē̵̟̎ ̶̡͍̩̽c̷̝͆o̷̩̤̓̑͝m̸͍͐̐͑̐ē̷̛̱͎̳͘͝s̶̢̰͖̭͙̐͑́̍͑ ̶͎̗̥͓͌̿́È̴̡̛̾̑b̷̠̈́̈́ǫ̸̛̫̩̑́̕n̷͔̖̦̟͈͋̋̔̔̆y̶̝̖̟͈̍͜"
  ],
  [
    "Don't let the guys upstairs hear you",
    "Ď̶̢͓͖̗͎̘̚̚ͅơ̶̺͐̕n̴̨̺̣̭̼̮̝͊̑̽͂͘͠͠'̴̣̯̖̟̠̙͉̖̋̀̓̓͂̈t̸̺̩̐͒͆͒̔̓̿̚ ̵̮͖̣͙͂̄̉͊̀̕ľ̴̨̞̰̼̱ẻ̸͖̘͉̅̐́͊͐̀̔t̴̥̳͙͚͉̽̑̒͝ ̸͚̹̘̆̌́̍̚ẗ̶̤̹̻͈̳́̎͗̉̍̌͝ḩ̵͔͆́́̂͋́͜͝ͅě̴̝̤͙̟͊͗̀͐͜ ̵̖͕͖͛̔͂̈́̈̇̇ĝ̴̮̯̯̗̪̟̓͛͘u̶̖̙͒́y̴̦̼̋͜ș̸̨̭͍̈́̃̄̑̌̊ ̶̤͈̹͈͙̞͓̄̏̊́͋̀̾̚ͅu̸̼̯̟̱̞̇̅͐̎͗͝p̸̖̭̙͐͊́s̷̛͎̫̳̃̃́͊t̷̡̰͕͆̉̏̍ạ̷̀̈̔̑̚͠i̴̧͚̯̦̯̭̒͗̋r̸̢̥̬̮̅̑̏ş̴̘͖͖̠͎͍̥̈́͋ ̸̞̹͎̈́̍́͠h̷̳͇̺̣̼̑͂̚e̶̠͚̠̟̥͙̯͖͌̑͑͐a̸̛͖̗̿̅̑͊͘͝r̶͎̫̩̹̮̦͇͐ ̷̜̀̂͋͒ẙ̴͇̅̄̊̑̈́͘͘o̷̧̨̲͇͚͓̜̔͊͋͑́͛͒͝u̸̘̓",
    "D̶̥̞̾o̷̮̅͑ͅn̸̖͆̓'̵̜͚͑t̶̺̔̏ ̶̯͉̃l̵͓̯͠e̷͎̓̔t̶̤̽̌ ̷̗̈́t̷̖̤̓h̵̗̀́ẽ̴̦̮ ̶͙͗͑g̵̥̈́u̶̢̜̾ẏ̷͙͉s̷̗̖̽̏ ̴̹̖̊͝ŭ̴̙̲p̸͖͍̿s̶̩͊t̴̙͍̆ȃ̷̘i̶̢͌̏ŕ̶͔ṣ̵̑͜ ̷̹̣̏̔h̷̠̎ȩ̵̅a̷͍̾͝ŕ̷̺͝ ̵̥͉̽y̶͈̚o̶̮͓͊̍u̶͔̩̾̆",
    "D̵̤̭͎̓̃̾̕ö̷̧̞̳ṋ̴͇͌̍̇'̶̞͖̭͔̜́̌͌t̶̳͛ ̷̟̣̏̐̂͂͑l̸̳͓̓͝e̸̦̹̮̰̐̉͠t̶̼͂̀̒ ̶͓̉̏̾̾t̵̛͔̓ͅh̶̻̻͔̯̯̋̊̄́̕é̴̬̟̤̝̼ ̴̣̃̚ģ̶̪̬̈́͜͜ų̵̨̻̌̿̾̏y̵̹̙͓̾͋̇͜s̶͚͌̊͂̕͝ ̸̤͐ų̸̼̭̘̣̄̓̚͝p̵̧͍̕s̷̡͈̗͕͎͊t̸̀̔͋͛̌ͅḁ̶̎̀ĩ̸̤͍̬͙̯͂̀͐r̴̙̦͍̋̃̚s̵̨̡̨͚͒͌̀ ̸̞̩̹̌̅ḧ̴̹̹̟̹́͝e̸͇̝̞͛̆̃͌͜ȃ̶̀̃̕͜r̴̛̬̰̱͋͂͠ ̸͙͉͉̤̳̆́̑̂̀y̵̨̛̗̏͆o̷̳̺͖̬̬͆͐ú̴̥"
  ],
  [
    "Zzzzzzzz",
    "Ẕ̴͉̈́̓z̴̛̝͛z̶̝̲̈z̸̛̜z̴͕̲̐͝z̸̘̯͒z̴͎͈̀z̵̰͛̊",
    "Z̷͚͎̝̤̑́̾̑̐̒͆̂ͅż̶̰̭̪̈͛z̷̯͕͕̃ž̴̤̭̑̔́̂̂̃ź̸̩̞͓͎̈́̒̈́̈́̉͝z̸̨͚̮͚̱̈́͗͊̅͋͐z̴̧̠͕̜̩̫͊̀͋̈́͛͌̋z̴̜̗̦͕͌̚",
    "Ž̷̘̤͙̱̄͌́z̷̭̍̃̋̽͑z̶̜̻̖̪͕̆z̸͕̥̻͍̄̽̅͛͜ź̸̧̢̻̭̎͝z̵̝̫̺͓͝z̷̝͕̙̬̟̏̈́͘ž̶̟̌̎̀"
  ],
  [
    "Think wok",
    "Ṫ̸̰h̷̡͌͘i̸̲͋n̵̟͋̏k̴̺͈͑ ̴̞̐w̴̝̞̏o̴̧̓̂k̷̨̻͐",
    "T̸̞̯̄ͅḩ̴̞̼͙̠̩͔͙̐̄̈́̒̀̉͋ỉ̸̻͔̳̝̥̱̞̼̾̽ņ̵̛̯͕̗͖̄́̽͌̐͋͌ḳ̶̿̏̑̿̽͋͘͝ ̷͎̗͋̐̀͆̂̓ẅ̸͚̞̠͔͕́̊͂̿̿͜ͅȯ̴͓̻̙͎̳̦̲͖̓̀͝k̶̙̫̠͂̌̚",
    "T̴̼̗͋h̸̭̞̿i̶͔̙͝n̶̻͗̓k̴̮̍̄ͅ ̸͇͙̑̓ẅ̵̹̲́̈o̴̞̳͗k̴͇̃̋"
  ],
  [
    "Eat, sleep, work",
    "E̷̳̤͆à̶̱̥̆t̴͍͎̓,̷̼̓̋ ̸̧͙́͆s̴͖̜̆͝l̴̲̣͒͝e̶̟̺͒ë̴̠̭́p̷͇̃,̸̼̃ ̸̳̗͒̈w̶̤̎ͅo̸̬̻̔r̵͚͊͒k̵͍̳̂̋",
    "E̵a̶t̸,̸ ̵s̴l̵e̷e̶p̷,̷ ̴w̷o̷r̵k̵",
    "E̵̟̣̣̪̋͗͝͠ả̷̘̲͙͍̦͖͋̂ẗ̵̢̞̠̇̅̍̚,̵̣̬̻̑͐ ̵̗̾͌͋̓́͒̓͝s̴̝̮͙̦̮͇̒̐̇̾̂̎͒̽l̴̨͍̭̤̖̻͙͖̿̅̅̊̈̈́̚è̷̥̖͂͊̌̐̈́͘e̴̞̩͕̱̽͊̈́ṕ̶̮̄͐̃,̶̜̗̗̮̩̫̝̝̆ ̵̛̰̻̦̱̦͛̎̈́̓̿̅ͅw̵͕͙̞͚͔̳̭͙̉̅̓̅̾̔̄o̸̮̰̭͋͌̕ͅͅr̵̹̈k̸̢̥͇̮̭̐͐̏̊̽̾́͘"
  ],
  [
    "Eyes on the prize",
    "E̷̱͒̕ý̵̬ȇ̴̗̚ş̵͕̈́ ̸͓̀́ǒ̵̦͍̉n̷̡̓ ̸̯̮̔̆t̸̥̂̅h̸̯͛͗ḗ̵̙ ̴̩̪̒́p̴̢̟̓r̷̢̈́̅į̵͌͊ẓ̸͌e̷̻̅͝",
    "Ȇ̴͕̘̘̋̑̓y̷̼̰̹͔̻̗̖͊̃̒e̷̢̺͖̣̟̬͆͘͠s̶͕̜͘ ̷͉̻̖̭͎̚o̵͔̫̍̀̑̀̕̕n̵̝̹̦͙̰͎͙̉͛̀͝͝ ̷̨͓̬̭̥͍͖̬̅͊ṫ̸̘̘̂͘ḫ̷̟͍͕͖̎́͛ĕ̷̛͍̳͒̌̽͠͠ ̶̛͈̠̗̳͛͊̎͌̎ͅp̵̦̮̐̔͝ŗ̵̝̬͕̘͛̃ͅi̵̖̳͙̻̜̻̺̦̐̂̅z̵̻̬̦̤̰̣̈͂͂͌e̴̢̦̻̗͉̥̤͐̐̈́̔ͅ",
    "Ě̸̫̱̚y̴͔̮̾̋e̴͝ͅs̶̭̣͘ ̸̛̥̝̈ǫ̵͗͛n̸͓̕ ̵̭̈̾t̴͈̲͊̎ĥ̵̲̥͘e̵̪̝͑̾ ̴̾̽ͅp̷̨̻̏͌r̷̼͋i̷̛̝̽z̶̢̿e̸͚̎"
  ],
  [
    "TGIF",
    "T̶̡͔̝̮͉̲̬̣͙͔͈̼̽͗͒̚Ḡ̸̨̛͎̞̊̇̒̈́͆̾̂͑̆̋͘͝͝I̷̧̛͖̩̗̤̩͛̎͂̄̀͑̾̿̔̆̑̈́̂͠F̵͔̻̳̙̘̙̬͎̀̕",
    "Ţ̷͂̃G̴͕̍Ị̶̦̄͐F̷̟̮̒",
    "T̴͔̩͝Ǵ̴̯̫͑Í̴̭͋F̸̽͜"
  ],
  [
    "How was your weekend?",
    "H̴̰̥̺͇̗̗̾͌̽ő̸̥̖̱̦͋̏̃̾͠ẅ̴͈͙̜́́͘ ̴̨͚̳́͜ẅ̴͚̝͓͎̓̋̑͒̃͠ͅą̷̗͔̯͑ͅś̵̳̹̺̭͒̽̔͘͠͝ ̶̹̯͚͕̗͚̯̦̿̊̽͒̚ẏ̷̛͖͓͔̘̙̫͉͌͋̿̈́̈͋ͅo̸̰͔̳͈̜̥͐̌̈́̾́̊ų̵̧̘͉͍̼̈́̌͗̑͘ͅř̶̡͍̝̘͙̀̏͆̍̕ ̶͇̌̒͆̊w̶̢̙͖̭͖̠̄̽̋͋̕ȩ̶̝̺͈̼͎̺̥͂̈͊́͌̒̈́è̵̼̖͒̑k̷̗̜̱̫̗̝̂̏̑͗̌ê̶̛͔̬̖̳̝̣̭̇͝n̷͚̙͌d̶̹̗̯̮̩̮͊̀̈́?̵̩͕̮̘̟̘̑̔̒̔",
    "Ḧ̵̨̼̪̼̜̼̭͉̂̈́̀͊ǫ̶̪̱̝͚͙̳̓̀̐̽̎̈̿̆ẅ̸̨̹̟͕̻̩̪̳͕̘̖̹́͜ ̵̨̛̪͓͕̖͌̏͑̋̔͌͂̈́̎͌̏͘ẁ̶̡̰̩̱̯̟̞̱͚͊̀̃͆̏͆̔͗̚͘͘ḁ̷͍̣̳͖̱̥̲̰̩͉̇̇͌͆̾͌̈́͛̑̋͛͜͝͠ͅs̶̨̨̤̗̘̯̖͇̦̝̬͛̾̾͐̃̌͊̐̒͘ ̸͖͈̖̥̑ŷ̸̹̱͓̣̮̙̞̀̆̓̽̓͋̈́͗̆͐͝ŏ̵͙̦͓̟̬͌͑̀̑͋ű̴̡͎̟̟̰̼̮͕̩͔̫͋̃͆͛̂͘͠ŕ̷̡͎͕̮͙̼̭͚̾̌̌̈́̋́̈́͒̆́̽͜͝ ̴̢̥̟̘̮̙̎̐͛̾̒́̅̈͊̅͌͘͜w̶̦͔͙̰̼̫̩̞̘̤͔̟͆̀̈́̈́̿̕͜͝e̴̥͚͍͍̖͈̱͓̓̋́͝ę̷͚̞̱̭̹͎̟͓̱̯̜͖̔ķ̴̢̛͙̤͖̮̗̞̳̜͈̠̋̋̌̓̆̂̓͂̅̽̽e̶̢͉̼̻̗̰͖̓̌́̋͋̌̿̌̄̌̽̃͠n̸̡̻̦̻͈̗̪͇̪͈̈́̃͌̀̈d̷̨͍̞͉̺̱̖͍͈̖̀͆̕͝ͅͅ?̵̜̞̲̫̣͚̮͑̒̀̒̅̈́̏̌͌̕͝",
    "H̶̺̭͂o̸̺͌͝w̵̞̹̐̕ ̵̧̭̍ẘ̶̦̻ă̷̬̝̔s̷͍̮̔ ̴̫͊ÿ̴̬͉́o̴̳͔̅͘u̷̹͋͠r̴̲̈̚ ̴̲̉̍w̵̥̒̽è̸̹̩ě̸͍k̵͖͇͂e̷̢̠̐ṇ̷̯͒d̶̖́?̴̬̏͌"
  ],
  [
    "Give 110%",
    "G̸͔̾̇i̸̡͊v̸̨͂͊ẻ̷̝͠ ̸͖͕̕͠1̶̼̂́1̷͔͙̓͐0̷͔̝̌̆%̷͔̥͋",
    "G̵̖͎͍̭̗̀́̎̃̃i̵̧̭̙̣̟̊̍͠͝v̵̞̩̿̔̈́͘͝e̷̩͖̓ ̵̠̗̍1̴̠͈̙͘1̴̙̖̻̓0̴̡̫̋̃̅̃̚͜%̷̡̜̼̹̺͗͛̾̚",
    "G̵̨̢̛͚̣͕̼̀͘ĩ̴̛̹̠̗̯͖̣͉̪̒́̽͗͝v̷̢̳͌̄̿̄̾̓̌ę̶̜͉̪̗̯̹͓̇̊̎͠ ̴̨̭̮̬̭̖̲̐1̷̤͌͂͑͊̀̕͘1̶̟̆͌̋̾̌̅̒̋0̷̣͎͕̠̼̖̹̟͗̀̇̽̈́%̴̧̼̩̯̑͆̈́̓̎̕"
  ],
  [
    "Think outside the box",
    "T̸̰͖̘̖̖̋̆ḩ̴̥̜̳̤̳͒̑͐i̸̹̪̖̲͇͉̮͖͗̂̀̋̔͝n̴͔̠̻͇̑̓̿̀͛̚̚ķ̵̧͚̺̟̪̰́̏͌̂͋̉͘ ̷̨̣̯͖͎̣̝̓̈́̉̉̿̿̋ò̵̫͈̦̲̦̪̤́̔̈́͝ͅú̷͙̠͚̱͜ẗ̷̞̙́̎̅̃̉̓̓͛s̷̡̞̺̬̣͗̒̃̓i̶̩̫̿͊̀͐̈ḑ̸͔̣̮̀͘è̸͉̣̓͆̋̀̽̚ͅ ̵̢͓̞͈̤͓̖̈̽̎͠t̷̢̢̲̱̗̣̥̄̅͝h̷̢̘͚͇̝̤͇̞͆̋́̐e̶̖̗͈̮̲̝̒͒̍̊ ̵̻̻͙̹͛̎̓̆͌̕͝b̷̹͖͍͕͒͘ò̸̱̠͎͈̼̔̆̽͋͑ẍ̶̦̤̝̬́",
    "T̶̲̱̃͊h̴̛̳̼̓i̷̻̓ṋ̵͝k̸̢͋̅ ̵̡̽̌ǫ̷̚͝ű̵͚̉t̴̘̊ṩ̷̝̉i̸͇͗͋d̵̩̈́͐ê̶̬̙̂ ̴̝͑̒t̴͘͜h̶͓̑̓͜e̷̮͗͜ ̵̠̚b̸̫̏̎ö̷̭̯̈́x̴̬͐̆",
    "T̷̫͙̜̈́̍̅͐̑͝ͅh̵͖͕͕͉͊i̷̱̿̃̕n̴̥̾̿͒̀k̶̡̜͇̥̆͗̏̚ ̶̜̗̐̈́̏̍o̵̻̲̐ų̴̹̩͉́͝t̴̲͖̑́̋s̸̛̪̱̔̄̃͊̾̊̔ͅį̵̟̘͍̪̺͊̽̉̆͆d̶͕̮̠̀̑͋̐̈́̍̔͂ë̷̮̯̭̰͇́̑̾ ̶̥̤̝̰̘͎̅͐͘t̵̹̼̆́h̷̛̛̯̘͂é̴̞̲͖̪͙̻̣̦ ̷̡̲͈͉̲̲̺̄̇̑͜b̶̳̥̞̯͉͉͚́͌͋͛͊́͠͝ͅo̶͎͎͋̃̒͋̓x̷͚̱̐͜͝ͅ"
  ],
  [
    "Boil the ocean",
    "B̶̹̮̹̱͎͕̜̉̈́́͗̽̚͝o̷͓̯͛͐̑͠i̴̻̓́̌̎ĺ̵̢̙̤͙̞̥̱̫ ̵͙̤̲̐͊̄̓t̴̢̨̨̳̤͖̲̰̄̈́̿̇̀ḩ̴̹͍͖̪̜̖̐̌̽e̸̛͙̜̱͌͗̾̌ ̸̫̥̘̦̤̫̭̋̎̏ǒ̶͉̜̮̩͓̏̐̃̑́̈̽c̴̢̭̻̑̂̅ẻ̵̻͔̺̗̠́a̶̧̛̲̙̽̿̄̐̍͆͜n̵̙̼͇̑͂͜",
    "B̶̘̏̿̿͗̚ö̴͔̯̥͖͖́̇͘͠ȉ̵̲̳l̵̗̲̕ ̸̣̆̄̏́͘t̵̺͙̻̓̈̒͗ḣ̸̭͚̘̂̍ë̶̞̭́̈͑͐͘ ̸̨̲̝̪͗̀̂o̵͇̮͚̤̓̀̀̾c̶̼̦̳̣͖̎é̵͎̔a̵̩͊͐̓̓n̷̐́͜",
    "B̸̦̏ò̸̝̜͋i̶̢̔̀l̷͎͋͜ ̴̰̳̒̀t̶̳́̓h̴̫͙̔e̴̺̒̿ ̶̳͎̽̈́o̵̺͋̈́ċ̶̛̟͉e̴̤͛͌a̸̜͚͒n̶̨̈͑"
  ],
  [
    "Let's circle back",
    "Ḹ̵̢̰̠͍̝̲̣̻̐̍͂͑̈́́̃è̵̛̫̩̥̌́ͅt̸̢̧̜̠͚̪̖͑̔̓͠͠'̵̛̰͕̅̆̋́s̴̡̢͇̲̖̜̤̾̊͑̕͠͠͝ͅͅ ̵͚̻͔̫̝͒͒̌̽́͋̕͠c̶̖̣̑̈́͊̕͜i̶̥̠̠̼͈͓̮̒̔͛̏̌r̴̛̛̻̦̰̪̳͈̄̓̑̉̓̄̊̚c̸͉͈̍̿̑̾̌̾͋̚l̶̛͍̝͕̪̊̔̍̊͐̓͆̈́͑͜e̷͇̬̠̳̭̼̤͊̏ ̷̤̄̚ͅb̷̡̤̎̔ā̴̮̪̣̜̗͖̳̪̉̿͜͝c̶̪̮̺̀̓͋̈̑̒̇́̽͘k̶̡͎̙̣̺̬̒",
    "L̵̺͎̇ê̷̞̬̚ẗ̶̩́'̶̥̐̍ś̶̫ ̶͇̯͑͝c̸̣͎̀́ȋ̵̘r̴̲̊͆c̶̪͙̒l̵͚͇̓ḛ̸̒ ̵̗̯̾̀b̶̤͇̀̈́a̵̳͠ͅc̵̺͔̓̋ķ̶̇̔",
    "Ḷ̷̡͍͉̻͙̾́̌̽̚ę̴͔̰̳̐̎̈̾̿̓͜t̸̛̙̗̱̭͋̒̓̀'̸̨̺̤͖̮̞̜͊͠s̵̬͚̃̂̈́͊̾̒ ̶̡̮̲̍̈́̕c̵͍̬̼̮̱͓̆͗i̸̹̲̕r̴̢̊͂͗̔̎c̶̨͉̠͂̈͒̅̑̉l̴̥̹̫̙̻̫͒̔͑͂̀̚͘ȩ̶̙̣̯̹̹̠̔ ̷͖̍̍͑̍͗̍̽̚b̸̝̆̍͗̏͗̓̕͘å̶̠̻̤͔͇͂ç̴͈͙̺̺̒k̵̥̒̔̆̊"
  ],
  [
    "There's no I in team",
    "T̴̩̞̣̠̖͙͙̯̺́̉̌̿͊̏̽̄͝͠h̶̺̣̬̼̋̈́̎̔̌͜͝͠ẹ̷̛̠̑̾͛̔̍̚r̴͖̦̟̭̼̬͉̈́̈́͛̒͒̚̚e̷͗͒̅̌̈́̈́̚͜'̶͍̺̐s̸̢͐͛͘͝ ̵̡̛̟̹͙͉͍̤͍͗͛ń̷͇̞̝o̸̘̳͖̦̥̠͂̏́̓̄͗̕͘ ̴̡̖͔͙̣̻͙͉̺́̅͑͊̃͋̎̀Ȋ̸̧̻͒̾̃͠ ̷̳̐ị̴̀̓̈́͝n̴̻͖͙̗͠ͅ ̵̢̞̻̹̙̺͇̆̆͆̽̍̋t̵̻̬̱̠̗̟̣͉͇̤͒̊̓̍̈̀͐̾̐ę̴̡̛̠̱̱̗͎̳̱̆̿͋̎͗̚͘͜ḁ̶̯̔̾m̷̢̥̩̼͚̠͇̼̈́̊̃͗̀̈́̕ͅ",
    "T̷̩͚͒́h̴͔̝͂͘ê̶̺̜ŗ̴̌̓e̴̮͂'̷̺̬͘͘s̴̡̥̏ ̶͎͌́͜n̶͙̍́o̶̯̅̓ ̸̛̛̯Į̶̲̊ ̸̟̘͗̓ĭ̴̺n̷̥̣͝ ̸̼̫́̒t̷̤͕̾̎e̶̬̭̕ą̵͈̒m̵͙͠",
    "Ţ̵̺̰̘̭̻̃̊̂̍̏̄͜͠ͅḧ̸̺́̒̉̌̉̇͠e̸̡̟͓̘͈͙̾́̈́͊ŗ̶̠̻̣̭̑̄̂̓͝͝e̴͍̫̜̖̯͑̍̍́̄̇̚ͅ'̷̗͑́̓s̷̢͍̜̖̣̦̯̦̏͛̏ ̶̙̟̼̯̻̦̠̝͌̈́͂̔̽n̵̡̩̺̭̞̥̂͑͒̄̑̂͠͝o̸̫̝͈̙̼̽̃̀̅̀ ̵̗̬̹̳̫͕̣̋̓͊̇͆̄̓̐I̶͔̦̗̳̓̃͗͂́͆͂ͅ ̷̧̨̛̛̜̺͎͍̻͑̌͆ͅḯ̸̧̺n̵̡̢̦̝̗̼̣̙̂̑́̀͠͝͝ ̵͖̝͓̱͋̈́t̶̢̓̓̈͑̓͝e̴̠̻̰͆́͌ả̶̝͕̲̯̉̒̆̑͝ͅm̴̢̢̘͎̦̳̿̊͊͜ͅ"
  ],
  [
    "Raise the bar",
    "R̸̘̲͉͕̀̔̍a̷̫̼̠͎͉̝͂̆̇̚i̴̛͚̬̣̲̓̄̚̚͝͠s̸͓̯̊̂̈̂̿̂e̶͇̾ͅ ̴̢̧̣̺̪͌͗͌͗̃t̴̺̦̯̯̞͍̀̓̌h̶̹͈͔̜̭̯͓͍̓̉͠͠e̶̡͓̬̯̦̦̼̎ͅ ̶̧̖̀͐͆͑̕͝b̷̭̮̾̈̇̈́a̴̩͊͌̀̐̿r̴̛̮͓͎̜̲͕̃͐̈͝͠",
    "R̶̩̟̅̀̅̀a̷͚̣̾͌̍̒̆͜i̵̦̠̫͌̒͑s̸͙̮͈̬̿̀͌̋e̴̘̜̠̺̓͂͜ ̷͖̱̟̎̎t̴̟̭͔̽̿̚h̶͓͌̋ę̵͙̺̹͌̑̓̕ ̴̼̱̫̰͑b̸̡̼͌̈́a̸̜̺̾͆̑͊r̷̡̻̘͇̍͗̽̅̑͜",
    "R̴̪̹̋a̵͔̓̓i̶̫̜̇͛s̸̟̈́͝e̴̼̒ ̸̢̩̓t̵̼̃̃h̸͇̉ë̸̞́̈ ̶̢̄̊b̶̙̟͝ą̸̟͋r̵̡̻͘"
  ],
  [
    "Quarterly earnings look good",
    "Q̶̺̿̐u̷̯̟͑̓a̵̲̞̓͒r̴̮͛t̷͓̎e̸̜̅͜r̸̠̫͆l̸̫͋y̶͙̠͘ ̴̮̳̿̌e̵̡̪̋a̴̧͎̐r̸̭͆͜n̶̳̓̓i̸͖̦̅n̴͓̫̑g̵̺͘ͅș̴̻̉ ̸̺̎͘l̷̥̀̕o̷̧̒ô̵͖̂k̸̼͠ ̶̯̿g̶̻̹̃͐o̵̺̟͊o̷̦͔͂̓d̶͚͙͝",
    "Q̷͈̹̐u̷͈͓͂͌ȧ̸̡̹r̵̗̹̿͝t̴̨̻͠e̷̮͌r̷̘͊̈͜l̵̹͕͊y̸̥͒̅ ̶̠̰͠e̶̫͌a̸̰͊̈́r̷̠̃n̵̡̹͛i̸̍͜͝n̸͙̻̍͑g̷̭̼̀͛s̵̤̕ ̴͈̣̓̑l̸̻̼̆o̶͈̓o̵̞̖͊k̴͕͋ ̴̨͒g̷̹͑o̴̞͕̓ȏ̴͓̾d̸͉̓̎͜",
    "Q̶͙͖̎ü̶̱̳̅a̸͍͍̿r̶̛̦̖t̴͈̦̍̑ẻ̷͔r̷͍̅̃ḷ̸͂y̶͉͙͌̀ ̶͎̫̅e̷͍͓̽ą̵̖͋́r̷̡̈n̶͎͓͘i̸̝̋͊ň̷͇̹g̷͖̫͐̐s̴͓̣̅ ̶̣̓͝l̶͖̻̓o̴̟̊ȍ̷̝̩k̶̥̃̈́ ̵̱̎̂ͅg̷̥̥̓̀ọ̸͊̿o̷̲̕d̶̻̱͂͆"
  ],
  [
    "Evaluations are coming up",
    "Ẻ̶̞͓̽v̸̡͙͒ä̸̯́ͅl̷͍̗̊ṷ̷͋̊ã̷͙̕t̶̮͝i̶͉̅o̷̺̅n̶̪̿̍s̵͚̉͐ ̶͚̜̅̃ầ̸̻͔r̴͕̰͌e̵͎͈̓̌ ̷͈͋̎c̵̗̓o̴͎̽̏m̵̧̤̓̚ị̷͍͒̆n̴͓̽͌g̴̨͍͑͂ ̴̭̜̑́ű̵̱͚p̴̺̝͊̚",
    "E̵͈͍͊v̵̖́̕ā̵͚̅l̶͕͕͆̐u̴̔̀͜a̶̩̅t̴̹͊̎í̴̗̈́ơ̶̩͒n̷̝̼̉s̸̬̅ ̸̰̃̏a̴̟̩͒̕ȓ̴̬̫̆ȅ̵̢̯̄ ̷̬̔c̷̮͉͋ò̶̻̳̀m̸͔̒̾ĩ̶̤́n̴͓͗g̶̥͗͒ ̸̥̝̽͠u̸̥̱͑͂ṕ̸̡̓",
    "E̴̥̗̋̓̑v̴̮͎̼͇̟̣̹̹͗͘ạ̵̧̥̘̱͋̈́̇̂l̴̡͖̮̗̹̻͖͓̉̀̄͂u̵̦͙͓͎̠͚̐̐̊̓̅̔̄̑ā̶̻̟̰͆̀͝t̷̞͍͓͈̠̾̀į̴̫̳̿͊̂̆͠͠o̵͇̳͙̟̒̿́͋n̷̼̟̠̩̓̍͝s̷̹̘͖̤̦͂̆̀̅ ̶̰̮̓͐̈́̓͝͝a̶̗̠̙͊͝r̵͙̒̒̀̅̓e̷̙̯͙͋̓̈̏͒͘ ̸̝̼̻̩̖͇͛̍̕ç̶̬͚͚̾͘͝ͅơ̷̮͐̊͠ḿ̶̧̖̤̩͛͜͜i̴̛̪͐̔̀̑͋͗ņ̷͕̪̜̙̖̀ǧ̸͉̤̍͊̂̀ ̸̛̗̬͍̖̬͆̓̿̐ṵ̸̀͒̈̋̇̿͜p̴̮̝͑͗̈́̿"
  ],
  [
    "We should touch base",
    "W̷̦͋̊e̷̲̾ ̷̬͔̐̋s̴͖͗ḩ̸̌o̸̞̤͋ǔ̷̞̕l̷̟̓͛d̴̻̪̽̿ ̴̙̐͛t̵̬̕ȯ̸͉̋ṷ̸̏c̴͎̐̀ͅh̶̖̉̚ ̸̧̠̒b̸̹̟̔a̸̜̿s̶͖͊̕e̵̙͎̕",
    "Ẇ̴̛̭̫̝͐͂è̶̟̬̣͍̫̺̓͗̂͝ ̴̖̈́̈́̐͋͝s̷̢͇̖̈́h̷̟̤̠͙̮̫͑̾͒͝͠o̷̜̺̫̥̳͛̿͜u̵͕̳͚͛̿̂͋̄̓̋͘l̵̨̉̓̀̊̋̊ď̴̩̖̞̫͇̖̽̈́̈́͜ ̴̞̓̃̒͌͗t̸̜̣̩̝͙̩̓̈͋̚͝o̸̰̼͛̉̏͊̈̔̏́ú̵̧͍̱͇͎̽̃c̸̠͖̫͎̺̬̥͆̎̓̚͝͝h̴̜̺̰̹̎̐̄́͒̐͝ ̷̡̢̪̻͎̯́͐͛̎́̃͆͠b̶̪̩̪̹͖͔͇̖̾̈́̀a̵͇͙͈̤̤͔̋͌̂͆͘ͅs̵̖͓̟̲̜͖͙̣̄́e̶̫̞̦̓̈́̋͜͝",
    "Ŵ̵̹̦͌ě̵̢̝ ̶͍̈́͌s̸̘͝h̸̞̱͠ó̷̟́ü̷̡̳l̴̼̀d̷̦̉ ̴̥̦͗͝t̴̘̐̈́o̸̤͋u̷̦̱̓c̶͐ͅh̵̻͑̔ ̷̮̩́̿b̶̺̦͑a̵̪͑͘ś̴̞͇̽e̵̪͎̍"
  ],
  [
    "ASAP ASAP",
    "A̸̖͌S̷̘̀̈́À̸̩͚P̷͍̹̓͗ ̶͕͚̌A̸͕͖͗S̴̺̱̍Ả̶̰̍P̴̜͎̕",
    "Ã̴̰̔Ś̸̯̩Ā̸͈̻̕P̵̹̈́͜ ̸̤͠A̷̖͆͋S̵̯̭̒̎Ą̷͖̑P̴̧̽",
    "Ä̸̪͕S̸̈ͅA̵̯͆͛P̷̭̖͘ ̵͉̉Ä̵̦́S̴̢̅A̵͉̿P̵̻͝"
  ],
  [
    "They're a team player",
    "T̷̜͙̽̑h̷̨͈͊̈e̴͚̹̓y̵̡̛̹'̴̰̭̆̓r̴͘͜ẹ̷̣̇ ̸͓̟͆̅a̴̡̳͛͝ ̷͚̐́t̸̛͙͠e̸̖͗ą̴̽͠m̶̦̌́ ̸̘̓̚p̶̰͎̾ḽ̶̚a̶̳̯͊̋y̵̢͈͑e̷͕̍ŗ̸͋ͅ",
    "T̵̞̲̆̉h̸͖̫͗͑e̴͕͗͂y̵̻͗͜͝'̴͚͂̿r̵̘͆͝e̶̫̒ ̷̦̈͘ā̷̹͈̀ ̸̠͋̈́t̸̜̍̏ë̸̼́ä̸͙̥ḿ̷͔ ̶̀̿ͅp̶̋͝ͅl̵̡͑͘ḁ̴̮̔y̶̬͗̀ḙ̸̣͗̈ŕ̵̬͘",
    "T̴̫̣͌́h̸͍̿̚e̷̫̻͋ỳ̶̛͔'̶͚̞̽͒r̴̪̙̾͋e̵̲̯͘ ̶̮̭̽̒a̴̦͖͒̀ ̴̧̰͂͆t̷̗͝e̷̩͆a̷̢͙͑͠m̷̢̫̉̏ ̶̨̬̊̍p̸̲͖͐l̸̼̉̂a̷̠͓̒ẙ̶͉͋ͅe̷̬͕̊ȑ̴̬̕"
  ]
];