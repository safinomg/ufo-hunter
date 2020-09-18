// --- positionInGame --- //

function InGamePosition(setting, level) {
    this.setting = setting;
    this.level = level;
    this.object = null;
    this.spaceship = null;
    this.bullets = [];
    this.lastBulletTime = null;
    this.ufos = [];
    this.bombs = [];
}
 
InGamePosition.prototype.entry = function (play) {
    this.spaceship_image = new Image();
    this.ufo_image = new Image();
    this.upSec = this.setting.updateSeconds;
    this.turnAround = 1;
    this.horizontalMoving = 1;
    this.verticalMoving = 0;
    this.ufosAreSinking = false;
    this.ufoPresentSinkingValue = 0;

    // Values ​​that change with levels (1. UFO speed, 2. Bomb falling speed, 3. Bomb dropping frequency)
    let presentLevel = this.level < 11 ? this.level : 10;
    // 1. UFO speed
    this.ufoSpeed = this.setting.ufoSpeed + (presentLevel * 7); //Level1: 35 + (1*7) = 42, Level2: 35 + (2*7) = 49, ...
    // 2. Bomb falling speed 
    this.bombSpeed = this.setting.bombSpeed + (presentLevel * 10); //Level1: 75 + (1*10) = 85, Level2: 75 + (2*10) = 95, ...
    // 3. Bomb dropping frequency 
    this.bombFrequency = this.setting.bombFrequency + (presentLevel * 0.05); //Level1: 0.05 + (1*0.05) = 0.1, Level2: 0.05 + (2*0.05) = 0.15 ...

    // Creating Spaceship
    this.spaceshipSpeed = this.setting.spaceshipSpeed;
    this.object = new Objects();
    this.spaceship = this.object.spaceship((play.width / 2), play.playBoundaries.bottom, this.spaceship_image);

    // Creating UFOS
    const lines = this.setting.ufoLines;
    const columns = this.setting.ufoColumns;
    const ufosInitial = [];

    let line, column;
    for (line = 0; line < lines; line++) {
        for (column = 0; column < columns; column++) {
            this.object = new Objects();
            let x, y;
            x = (play.width / 2) + (column * 50) - ((columns - 1) * 25);
            y = (play.playBoundaries.top + 30) + (line * 30);
            ufosInitial.push(this.object.ufo(
                x,
                y,
                line,
                column,
                this.ufo_image,
                this.level
            ));
        }
    }
    this.ufos = ufosInitial;
};

InGamePosition.prototype.update = function (play) {
    const spaceship = this.spaceship;
    const spaceshipSpeed = this.spaceshipSpeed;
    const upSec = this.setting.updateSeconds;
    const bullets = this.bullets;

    // Keyboard events
    if (play.pressedKeys[37]) {
        spaceship.x -= spaceshipSpeed * upSec;
    }
    if (play.pressedKeys[39]) {
        spaceship.x += spaceshipSpeed * upSec;
    }
    if (play.pressedKeys[32]) {
        this.shoot();
    }

    // Keep spaceship in 'Active playing field'
    if (spaceship.x < play.playBoundaries.left) {
        spaceship.x = play.playBoundaries.left;
    }
    if (spaceship.x > play.playBoundaries.right) {
        spaceship.x = play.playBoundaries.right;
    }

    //  Moving bullets
    for (let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i];
        bullet.y -= upSec * this.setting.bulletSpeed;
        // If our bullet flies out from the canvas it will be cleared
        if (bullet.y < 0) {
            bullets.splice(i--, 1);
        }
    }

    // Movements of UFOS
    let reachedSide = false;

    for (let i = 0; i < this.ufos.length; i++) {
        let ufo = this.ufos[i];
        let fresh_x = ufo.x + this.ufoSpeed * upSec * this.turnAround * this.horizontalMoving;
        let fresh_y = ufo.y + this.ufoSpeed * upSec * this.verticalMoving;
        if (fresh_x > play.playBoundaries.right || fresh_x < play.playBoundaries.left) {
            this.turnAround *= -1;
            reachedSide = true;
            this.horizontalMoving = 0;
            this.verticalMoving = 1;
            this.ufosAreSinking = true;
        }
        if (reachedSide !== true) {
            ufo.x = fresh_x;
            ufo.y = fresh_y;
        }
    }

    if (this.ufosAreSinking == true) {
        this.ufoPresentSinkingValue += this.ufoSpeed * upSec;
        if (this.ufoPresentSinkingValue >= this.setting.ufoSinkingValue) {
            this.ufosAreSinking = false;
            this.verticalMoving = 0;
            this.horizontalMoving = 1;
            this.ufoPresentSinkingValue = 0;
        }
    }

    // UFOS bombing 
    // Sorting UFOS - which are at the bottom of each column
    const frontLineUFOs = [];
    for (let i = 0; i < this.ufos.length; i++) {
        let ufo = this.ufos[i];
        if (!frontLineUFOs[ufo.column] || frontLineUFOs[ufo.column].line < ufo.line) {
            frontLineUFOs[ufo.column] = ufo;
        }
    }

    // Give a chance for bombing
    for (let i = 0; i < this.setting.ufoColumns; i++) {
        let ufo = frontLineUFOs[i];
        if (!ufo) continue;
        let chance = this.bombFrequency * upSec;
        this.object = new Objects();
        if (chance > Math.random()) {
            // make a bomb object and put it into bombs array	
            this.bombs.push(this.object.bomb(ufo.x, ufo.y + ufo.height / 2));
        }
    }

    // Moving bombs
    for (let i = 0; i < this.bombs.length; i++) {
        let bomb = this.bombs[i];
        bomb.y += upSec * this.bombSpeed;
        // If a bomb falls out of the canvas it will be deleted
        if (bomb.y > this.height) {
            this.bombs.splice(i--, 1);
        }
    }

    // UFO-bullet collision
    for (let i = 0; i < this.ufos.length; i++) {
        let ufo = this.ufos[i];
        let collision = false;
        for (let j = 0; j < bullets.length; j++) {
            let bullet = bullets[j];
            // collision check
            if (bullet.x >= (ufo.x - ufo.width / 2) && bullet.x <= (ufo.x + ufo.width / 2) &&
                bullet.y >= (ufo.y - ufo.height / 2) && bullet.y <= (ufo.y + ufo.height / 2)) {
                // if there is collision we delete the bullet and set collision true
                bullets.splice(j--, 1);
                collision = true;
                play.score += this.setting.pointsPerUFO;
            }
        }
        // if there is collision we delete the UFO
        if (collision == true) {
            this.ufos.splice(i--, 1);
            play.sounds.playSound('ufoDeath');
        }
    }

    // Spaceship-bomb collision
    for (let i = 0; i < this.bombs.length; i++) {
        let bomb = this.bombs[i];
        if (bomb.x + 2 >= (spaceship.x - spaceship.width / 2) &&
            bomb.x - 2 <= (spaceship.x + spaceship.width / 2) &&
            bomb.y + 6 >= (spaceship.y - spaceship.height / 2) &&
            bomb.y <= (spaceship.y + spaceship.height / 2)) {
            // if there is collision we delete the bomb   
            this.bombs.splice(i--, 1);
            // effect on the spaceship
            play.sounds.playSound('explosion');
            play.shields--; //one hit
        }
    }

    // Spaceship-UFO collision
    for (let i = 0; i < this.ufos.length; i++) {
        let ufo = this.ufos[i];
        if ((ufo.x + ufo.width / 2) > (spaceship.x - spaceship.width / 2) &&
            (ufo.x - ufo.width / 2) < (spaceship.x + spaceship.width / 2) &&
            (ufo.y + ufo.height / 2) > (spaceship.y - spaceship.height / 2) &&
            (ufo.y - ufo.height / 2) < (spaceship.y + spaceship.height / 2)) {
            // if there is collision the spaceship explodes
            play.sounds.playSound('explosion');
            play.shields = -1; //instant death
        }
    }

    // Spaceship death check
    if (play.shields < 0) {
        play.goToPosition(new GameOverPosition());
    }

    // Level completed
    if (this.ufos.length == 0) {
        play.level += 1;
        play.goToPosition(new TransferPosition(play.level));
    }
};

InGamePosition.prototype.shoot = function () {
    if (this.lastBulletTime === null || ((new Date()).getTime() - this.lastBulletTime) > (this.setting.bulletMaxFrequency)) {
        this.object = new Objects();
        this.bullets.push(this.object.bullet(this.spaceship.x, this.spaceship.y - this.spaceship.height / 2, this.setting.bulletSpeed));
        this.lastBulletTime = (new Date()).getTime();
        play.sounds.playSound('shot');
    }
};

InGamePosition.prototype.draw = function (play) {
    // draw Spaceship
    ctx.clearRect(0, 0, play.width, play.height);
    ctx.drawImage(this.spaceship_image, this.spaceship.x - (this.spaceship.width / 2), this.spaceship.y - (this.spaceship.height / 2));

    // draw Bullets 
    ctx.fillStyle = '#ff0000';
    for (let i = 0; i < this.bullets.length; i++) {
        let bullet = this.bullets[i];
        ctx.fillRect(bullet.x - 1, bullet.y - 6, 2, 6);
    }

    // draw UFOS     
    for (let i = 0; i < this.ufos.length; i++) {
        let ufo = this.ufos[i];
        ctx.drawImage(this.ufo_image, ufo.x - (ufo.width / 2), ufo.y - (ufo.height / 2));
    }

    // draw bombs
    ctx.fillStyle = "#FE2EF7";
    for (let i = 0; i < this.bombs.length; i++) {
        let bomb = this.bombs[i];
        ctx.fillRect(bomb.x - 2, bomb.y, 4, 6);
    }

    // draw Sound & Mute info
    ctx.font = "16px Comic Sans MS";

    ctx.fillStyle = "#545252";
    ctx.textAlign = "left";
    ctx.fillText("Press S to switch sound effects ON/OFF.  Sound:", play.playBoundaries.left, play.playBoundaries.bottom + 70);

    let soundStatus = (play.sounds.muted === true) ? "OFF" : "ON";
    ctx.fillStyle = (play.sounds.muted === true) ? '#FF0000' : '#0B6121';
    ctx.fillText(soundStatus, play.playBoundaries.left + 375, play.playBoundaries.bottom + 70);
    
    ctx.fillStyle = '#0B6121';
    ctx.textAlign = "right";
    ctx.fillText("Press P to Pause.", play.playBoundaries.right, play.playBoundaries.bottom + 70);

    // draw Score & Level
    ctx.textAlign = "center";
    ctx.fillStyle = '#BDBDBD';

    ctx.font = "bold 24px Comic Sans MS";
    ctx.fillText("Score", play.playBoundaries.right, play.playBoundaries.top - 75);
    ctx.font = "bold 30px Comic Sans MS";
    ctx.fillText(play.score, play.playBoundaries.right, play.playBoundaries.top - 25);

    ctx.font = "bold 24px Comic Sans MS";
    ctx.fillText("Level", play.playBoundaries.left, play.playBoundaries.top - 75);
    ctx.font = "bold 30px Comic Sans MS";
    ctx.fillText(play.level, play.playBoundaries.left, play.playBoundaries.top - 25);

    // draw Shields
    ctx.textAlign = "center";
    if (play.shields > 0) {
        ctx.fillStyle = '#BDBDBD';
        ctx.font = "bold 24px Comic Sans MS";
        ctx.fillText("Shields", play.width / 2, play.playBoundaries.top - 75);
        ctx.font = "bold 30px Comic Sans MS";
        ctx.fillText(play.shields, play.width / 2, play.playBoundaries.top - 25);
    }
    else {
        ctx.fillStyle = '#ff4d4d';
        ctx.font = "bold 24px Comic Sans MS";
        ctx.fillText("WARNING", play.width / 2, play.playBoundaries.top - 75);
        ctx.fillStyle = '#BDBDBD';
        ctx.fillText("No shields left!", play.width / 2, play.playBoundaries.top - 25);
    }
};

InGamePosition.prototype.keyDown = function (play, keyboardCode) {
    if (keyboardCode == 83) {   // Mute sound: S
        play.sounds.muteSwitch();
    }
    if (keyboardCode == 80) {   // Pause: P
        play.pushPosition(new PausePosition());
    }
};



