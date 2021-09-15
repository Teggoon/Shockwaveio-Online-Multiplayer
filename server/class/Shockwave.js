const dist = require("../function/dist");

function Shockwave (id, shockwaveID, x, y, angle, angleWidth, velocity, tV) {
    this.angle = angle;
    this.angleWidth = angleWidth / 180 * Math.PI; //sweep of the arc
    this.x=x;
    this.y=y;
    this.velocity = velocity;
    this.transparency = 255;
    this.transparencyV = tV;
    this.radius = 0;
    this.id = id;
    this.shockwaveID = shockwaveID;
}
Shockwave.prototype.move = function () {
    this.transparency -= this.transparencyV;
    this.radius += this.velocity;
};

Shockwave.prototype.collision = function (p) {
    if (p.id == this.id) {
        return;
    }

    var angleToP = Math.atan2(p.y - this.y, p.x - this.x);
    var angleDifference = (angleToP - this.angle);
    if (p.z <= 0 && Math.abs(angleDifference) <= this.angleWidth / 2 &&
      Math.abs(dist(this.x,this.y,p.x,p.y) - (this.radius + 5)) < 10) {
        p.vx = Math.cos(this.angle) * 3;
        p.vy = Math.sin(this.angle) * 3;
        p.life -= 15;
        p.sendStatusUpdate();
    }

};
/**
Check if current shockwave should be deleted
*/
Shockwave.prototype.checkDie = function() {
  if (this.transparency <= 0) {
    return true;
  }
  /**KEVIN start*/

  /**KEVIN end*/

  return false;
};

/**
Function that sends instruction to all clients to delete current shockwave
*/
Shockwave.prototype.killOnClient = function(io) {
  io.emit("kill shockwave", this.id, this.shockwaveID);
};

/**
Function that sends all clients the info of the current shockwave
*/
Shockwave.prototype.updateOnClient = function(io) {
  //id, shockwaveID, x, y, angle, radius, velocity, tV
  io.emit("update shockwave", this.id, this.shockwaveID, this.x, this.y, this.angle, this.angleWidth, this.radius, this.velocity, this.transparency, this.transparencyV);
};

module.exports = Shockwave;