/// <reference path="TSDef/p5.global-mode.d.ts" />

class Player {
  constructor(x, y, charAnim) {
    // ---- Movement/Direction Logic
    this.position = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.radius = 18;
    this.speed = 0.15; //don't go over 1
    // ----- movement controls here.  -----

    this.possibleMoveDir = [true, true, true, true]; //UP,LEFT,DOWN,RIGHT
    this.controls = ["w", "a", "s", "d"]; //UP,LEFT,DOWN,RIGHT
    this.altControls = [UP_ARROW, LEFT_ARROW, DOWN_ARROW, RIGHT_ARROW]; //UP,LEFT,DOWN,RIGHT
    this.movement = [false, false, false, false]; //UP,LEFT,DOWN,RIGHT
    this.charAnim = charAnim;
    //Avatar color
    this.color = color(0, 150, 0);
    //this.mesh =  new SpriteObject(this.position.x,this.position.y,charAnim)
  }

  start() {
    this.render();
    this.update();
  }

  render() {
    push();
    //noStroke();
    //fill(this.color);
    //renders player avatar right here
    // image(charSprite, this.position.x, this.position.y);
    animation(this.charAnim, this.position.x,this.position.y);
    //ellipseMode(CENTER);
    //ellipse(this.position.x, this.position.y, this.radius * 2);
    //this.mesh.start();
    pop();
  }

  update() {
    // ---- Movement Logic ----
    this.velocity.add(this.acceleration);
    
    // clamp velocity to 0 if you're up against a wall
    if (!this.possibleMoveDir[0]) {
      // UP
      this.velocity.y = max(0, this.velocity.y);
    }
    if (!this.possibleMoveDir[2]) {
      //Down
      this.velocity.y = min(0, this.velocity.y);
    } 
    
    if (!this.possibleMoveDir[1]) {
      // Left
      this.velocity.x = max(0, this.velocity.x);
    }
    if (!this.possibleMoveDir[3]) {
      //Right
      this.velocity.x = min(0, this.velocity.x);
    }
    
    // If you're stuck vertically in a wall, automatically slide out
    if (!this.possibleMoveDir[0] && !this.possibleMoveDir[2]) {
     this.velocity.y = this.speed * 10; 
    }

    
    // Apply the frame factor, update position, clear acceleration, and apply drag
    let thisFrameVelo = this.velocity.copy();
    thisFrameVelo.mult(deltaTime / 1000 * 60);
    this.position.add(thisFrameVelo);
    this.acceleration.mult(0);

    this.velocity.mult(0.9);

    // Update speed according to inputs
    if (this.movement[0]) {
      //UP MOVEMENT
      this.applyForce(0, -this.speed);
    }

    if (this.movement[1]) {
      // LEFT MOVEMENT
      this.applyForce(-this.speed, 0);
    }

    if (this.movement[2]) {
      // DOWN MOVEMENT
      this.applyForce(0, this.speed);
    }

    if (this.movement[3]) {
      // RIGHT MOVEMENT
      this.applyForce(this.speed, 0);
    }

    //---- Map Constraints ----

    // this.position.x = constrain(
    //   this.position.x,
    //   -2545,
    //   2769
    // );
    // this.position.y = constrain(
    //   this.position.y,
    //   -2637,
    //   2675
    // );
  }

  reset() {}

  curing() {}

  startEffect() {}

  applyForce(x, y) {
    this.acceleration.add(createVector(x * deltaTime / 1000 * 60, y * deltaTime / 1000 * 60));
  }
}
