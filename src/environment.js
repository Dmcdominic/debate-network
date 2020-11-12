/// <reference path="TSDef/p5.global-mode.d.ts" />

const MIN_VISIBLE_PLAYER_DIST = 180;

var frame_factor;

var starting_positions = [
  { "x": -1500, "y": -700},
  { "x": -1500, "y": 640},
  { "x": 1500, "y": -700},
  { "x": 1500, "y": 640},
]

class Environment {
  constructor(img, backimg, img2, backimg2, socket, charAnim1,charAnim2,charAnim3, doorImg, doorBackImg, collider,collider2,decor1,decor2) {
    this.charAnim1 = charAnim1;
    this.charAnim2 = charAnim2;
    this.charAnim3 = charAnim3;
    let start_pos = starting_positions[Math.floor(random() * starting_positions.length)]
    this.player = new Player(start_pos.x, start_pos.y, this.charAnim1);
    this.saved_state;
    this.socket = socket;

    this.players_lerped = {};
    this.visible_players = 0;

    //---- Map Variables ---
    this.backimg = backimg;
    this.image = img;
    this.scale = 1;

    this.backimg2 = backimg2;
    this.image2 = img2;
    this.scale2 = 2.5;

    //---- Doors ----
    this.initDoors(doorImg, doorBackImg);

    //---- DecorAnim1 ----
    this.collider = collider;
    this.othercollider =collider2;
    this.decorAnimSprites = [];
    this.decorAnimTypes = [];
    this.decor1 = decor1;
    this.decor2 = decor2;
        
  }
  
 
  makeSprites(AnimType,x,y,sprites, rows, rowGap, colGap, gaps)
  {
    var animi;
    let origX = x;
    //let origY = y;
    for (var row = 0; row < rows; row++)
    {
      origX = x;
      for (var spriteCount = 0; spriteCount < sprites; spriteCount++)
      {
        if (spriteCount % gaps == 0)
        {
          origX+=colGap;
        }
        else {
          if (AnimType == 1)
          {
            animi = new SpriteObject(origX, y,this.decor1,this.collider);
            this.decorAnimTypes.push(1);
          }
          else
          {
            animi = new SpriteObject(origX, y,this.decor2,this.collider);
            this.decorAnimTypes.push(0);

          }
          this.decorAnimSprites.push(animi);
          origX+=colGap;
        }
      }
      y+=rowGap;
    }
  }

  drawSpriteColliders(w1,h1,w2,h2) //This will have to go before drawSprite()... it's O(2n) time complexity... Too Bad!
  {
    for(var i = 0; i < this.decorAnimSprites.length; i ++)
    {
      if (this.decorAnimTypes[i] == 1)
      {
        image(
          this.collider,
          this.decorAnimSprites[i].position.x,
          this.decorAnimSprites[i].position.y,
          w1,
          h1,
        );
      }
      else
      {
        image(
          this.collider,
          this.decorAnimSprites[i].position.x-20,
          this.decorAnimSprites[i].position.y+25,
          w2,
          h2,
        );
      }
    }
  }

  drawSprites()
  {
    for(var i = 0; i < this.decorAnimSprites.length; i ++)
    {
      this.decorAnimSprites[i].start();
    }
  }

  collidersLogic() {
    let regX = floor(width / 2);
    let regY = floor(height / 2);

    //offsets need to be tweaked a little bit
    let rightX = regX + this.player.radius + 1;
    let leftX = regX - this.player.radius - 1;
    let topY = regY - this.player.radius - 1;
    let botY = regY + this.player.radius + 1;

    //Let's choose the blue in RGBA for testing purposes...
    let RBGA_Index = 0;

    let interested = 255;

    // Load the pixels array and then check the ones you need, rather than calling get() 4 times
    loadPixels();
    let d = pixelDensity();

    let i_right = 4 * ( (regY * width * d) + (rightX * d) );
    let i_left  = 4 * ( (regY * width * d) + (leftX * d) );
    let i_top   = 4 * ( (topY * width * d) + (regX * d) );
    let i_bot   = 4 * ( (botY * width * d) + (regX * d) );

    let rightColor = pixels[i_right + RBGA_Index];
    let leftColor = pixels[i_left + RBGA_Index];
    let topColor = pixels[i_top + RBGA_Index];
    let botColor = pixels[i_bot + RBGA_Index];
    // let rightColor = get(rightX, regY)[RBGA_Index];
    // let leftColor = get(leftX, regY)[RBGA_Index];
    // let topColor = get(regX, topY)[RBGA_Index];
    // let botColor = get(regX, botY)[RBGA_Index];

    //Stop player upon impacting interested color.
    this.player.possibleMoveDir[0] = topColor != interested;
    this.player.possibleMoveDir[1] = leftColor != interested;
    this.player.possibleMoveDir[2] = botColor != interested;
    this.player.possibleMoveDir[3] = rightColor != interested;
  }

  start() {
    frame_factor = deltaTime / 1000 * 60;
    // original environment start() code
    push();
    // ----- PLAYER TRANSLATE -----
    translate(
      width / 2 - this.player.position.x,
      height / 2 - this.player.position.y
    );

    // draw wall image
    imageMode(CENTER);

    image(
      this.backimg,
      0,
      0,
      this.backimg.width * this.scale,
      this.backimg.height * this.scale
    );

    image(
      this.backimg2,
      0,
      -2474 / 2 - (this.image2.height * this.scale2) / 2 + 60,
      this.image2.width * this.scale2,
      this.image2.height * this.scale2
    );
    this.drawSpriteColliders(185,300,370,225);
    // Draw door backImages
    this.drawDoors(true);

    // Call player collider logic here
    this.collidersLogic();
    //draw map background
    if (true) //for debug purposes 
    {
      image(
        this.image,
        0,
        0,
        //this.image.width * this.scale,
        //this.image.height * this.scale
        3800 + 2500,
        2474 - 12
      );

      image(
        this.image2,
        0,
        -2474 / 2 - (this.image2.height * this.scale2) / 2 + 60,
        this.image2.width * this.scale2,
        this.image2.height * this.scale2
      );
    }
    

    this.player.start();
    this.drawSprites();
    this.drawOtherPlayers();
    
    // Update doors then draw door images
    this.drawDoors(false);
    this.updateDoors();

    pop();
  }

  optimize() {}

  gameLoop() {}

  spawn(pos) {}

  // Draws only players who are very close
  drawOtherPlayers() {
    if (!this.socket) return;
    if (!this.saved_state) return;

    this.visible_players = 0;

    //iterate through the players
    for (let playerID in this.saved_state.players) {
      if (playerID == this.socket.id) continue;
      if (!this.saved_state.players.hasOwnProperty(playerID)) continue;

      // Update their lerped position
      if (!this.players_lerped[playerID]) {
        this.players_lerped[playerID] = this.saved_state.players[playerID];
      }

      let playerState = this.saved_state.players[playerID];
      let lPlayerState = this.players_lerped[playerID];
      let disp_x = playerState.x - lPlayerState.x; // Displacement x
      let disp_y = playerState.y - lPlayerState.y; // Displacement y
      let dist = sqrt(disp_x * disp_x + disp_y * disp_y); // Distance

      let speed = this.player.velocity.mag() * frame_factor;
      if (dist <= speed) {
        this.players_lerped[playerID] = playerState;
      } else {
        lPlayerState.x += (disp_x / dist) * speed;
        lPlayerState.y += (disp_y / dist) * speed;
        this.players_lerped[playerID] = lPlayerState;
      }

      // Now actually draw them
      // check if they're too far to be seen
      let dist_x = this.player.position.x - lPlayerState.x;
      let dist_y = this.player.position.y - lPlayerState.y;
      let dist_sqrd = dist_x * dist_x + dist_y * dist_y;

      // Any player that's quite far from you should just snap to their true position
      if (dist_sqrd > MIN_VISIBLE_PLAYER_DIST * MIN_VISIBLE_PLAYER_DIST * 9) {
        this.players_lerped[playerID] = playerState;
      }

      if (dist_sqrd > MIN_VISIBLE_PLAYER_DIST * MIN_VISIBLE_PLAYER_DIST)
        continue;
      this.visible_players++;

      //draw a pointer image for each player except for myself
      // image(pointer, lPlayerState.x + i * 5, lPlayerState.y + i * 3);
      // temp player drawing
      push();
      //translate(lPlayerState.x, lPlayerState.y);
      animation(this.charAnim2, lPlayerState.x, lPlayerState.y);

      pop();
    }
  }

  // ----- Doors -----
  initDoors(doorImg, doorBackImg) {
    this.doors = [
      new Door(doorImg, doorBackImg, -10, -1210, 200, 0)
    ];
  }

  // Check if each door should move towards or away from its original position
  updateDoors() {
    if (!this.doors) return;
    for (let door of this.doors) {
      door.open = false;
      // Has to be at least 1 other player nearby
      if (this.visible_players > 0) {
        // Just set all doors open when a player is nearby
        door.open = true;
        // PREVIOUSLY: Now check if you're actually near this door
//         let dist_x = this.player.position.x - door.position.x;
//         let dist_y = this.player.position.y - door.position.y;
//         let dist_sqrd = dist_x * dist_x + dist_y * dist_y;

//         if (dist_sqrd < MIN_VISIBLE_PLAYER_DIST * MIN_VISIBLE_PLAYER_DIST * 9) {
//           door.open = true;
//         }
      }
      
      // let speed = 0.06;
      // if (door.open) {
      //   door.position.x += (door.open_pos.x - door.position.x) * speed * frame_factor;
      //   door.position.y += (door.open_pos.y - door.position.y) * speed * frame_factor;
      //   // door.position = door.open_pos;
      // } else {
      //   door.position.x += (door.closed_pos.x - door.position.x) * speed * frame_factor;
      //   door.position.y += (door.closed_pos.y - door.position.y) * speed * frame_factor;
      //   // door.position = door.closed_pos;
      // }
    }
  }
  
  // Draw doors. If backImgPass == true, draw backImage instead of image
  drawDoors(backImgPass) {
    if (backImgPass && this.visible_players > 0) return;
    if (!backImgPass && this.visible_players <= 0) return;
    for (let door of this.doors) {
      let img = (backImgPass) ? door.backImage : door.image;
      image(img, door.position.x, door.position.y, img.width * door.scale, img.height * door.scale);
    }
  }
}

class Door {
  constructor(img, backImg, x, y, offset_x, offset_y) {
    this.image = img;
    this.backImage = backImg;
    this.position = createVector(x, y);
    this.closed_pos = createVector(x, y);
    this.open_pos = createVector(x + offset_x, y + offset_y);
    this.open = false;
    this.scale = 0.4;
  }
}

// ----- GLITCH EFFECT -----

// Source - https://code.sololearn.com/WeKRgDG08m1p/#js

// TODO - maybe
