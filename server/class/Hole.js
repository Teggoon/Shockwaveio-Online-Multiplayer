const dist = require("../function/dist");

//JELAN, VICTORIA
function Hole(x,y,size) {
    this.x = x;
    this.y = y;
    this.size = size;
};
Hole.prototype.checkCollisionWithUser = function (character) {
/**VICTORIA start*/
    if ( (dist(this.x, this.y, character.x, character.y) <= this.size) && character.z <= 0){
      return true;
    }
/**VICTORIA end*/
  return false;
};

module.exports = Hole;