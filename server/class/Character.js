/**
CLASS Character:
An in-game character belonging to a user.
Constructor:
@param: integer ID
@param: name of the character
@param: the user object it belongs to
@param: initial x position
@param: initial y position
*/
//VICTORIA
function Character (id, name, user, x, y) {
    this.id = id;
    this.user = user;
    this.x = x;
    this.y = y; //position in the air, 0 means on the ground
    this.z = 0;
    this.r = 0;
    this.score = 0;
    this.name = name;
    this.vx = 0;
    this.vy = 0;
    this.velocity = 10;
    this.life = 100;
    this.radius = 30;
}
Character.prototype.acceptPositionUpdate = function(x, y, z, r) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.r = r;
}

Character.prototype.checkDie = function(sendDeathToClient) {
  if (this.life <= 0) {
    sendDeathToClient(this);
  }
};

Character.prototype.sendPositionUpdate = function(io) {
  io.emit("update position", this.id, this.x, this.y, this.z, this.r, this.velocity);
};

Character.prototype.sendPositionUpdateOVERRIDE = function(io) {
  io.emit("OVERRIDE position", this.id, this.x, this.y, this.z, this.r, this.velocity);
};

Character.prototype.sendStatusUpdate = function(io) {
  io.emit("update stats", this.id, this.score, this.life);
};

module.exports = Character;
