const Character = require("./Character");
/**
CLASS User
Constructor:
@param: integer ID
@param: name of the user
@param: the socket connection of the user
*/
function User (id, name, sock) {
    this.name = name;
    this.socket = sock;
    this.id = id;
    var spawnLocationX = 0;
    var spawnLocationY = 0;

    //make a new character for the user
    this.character = new Character(id, name, this, spawnLocationX, spawnLocationY);
    this.score = 0;
}

module.exports = User;