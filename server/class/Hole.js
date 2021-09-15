const dist = require("../function/dist");

//JELAN, VICTORIA
function Hole(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
};
Hole.prototype.checkCollisionWithUser = function (character) {
/**VICTORIA start*/
    if ( (dist(this.x, this.y, character.x, character.y) <= this.radius - character.radius) && character.z <= 0){
      return true;
    }
/**VICTORIA end*/
  return false;
};

module.exports = Hole;