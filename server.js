var http = require('http');
var fs = require('fs');


/**IMPORTANT GAME VARIABLES HERE*/
const MAP_SIZE = 2000;
const HOLE_NUM = 30;


var canvasWidth = 750;
var canvasHeight = 450;

/*
* https://openclassrooms.com/en/courses/2504541-ultra-fast-applications-using-node-js/2505653-socket-io-let-s-go-to-real-time
*/
// Loading the index file . html displayed to the client
var server = http.createServer(function(req, res) {

    console.log('A client is connected!');
    fs.readFile('index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });

});

var socketUserMap = new Map();

var characters = new Map(); //map of each character
var shockwaves = new Map(); //map of all the shockwaves
var idCounter = 1; //counter for user's ID
var shockwaveCounter = 1; //counter for shockwave's ID

/**
@param: first item's x position
@param: first item's y position
@param: second item's x position
@param: second item's y position
@return the distance between them on the Cartesian plane
*/
function dist(x1, y1, x2, y2) {
  return Math.sqrt(Math.sq(x2 - x1) + Math.sq(y2 - y1));
}


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
    var spawnLocationX = Math.random() * canvasWidth;
    var spawnLocationY = Math.random() * canvasHeight;

    //make a new character for the user
    this.character = new Character(id, name, this, spawnLocationX, spawnLocationY);
    this.score = 0;
}



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
function Character (id, name, user, x, y) {
    this.id = id;
    this.user = user;
    this.x = x;
    this.y = y;
    this.z = 0;
    this.r = 0;
    this.score = 0;
    this.name = name;
    this.vx = 0;
    this.vy = 0;
    this.velocity = 10;
    this.life = 100;
}
Character.prototype.acceptPositionUpdate = function(x, y, z, r) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.r = r;
}




function Shockwave (id, shockwaveID, x, y, angle, angleWidth, velocity, tV) {
    this.angle = angle;
    this.angleWidth = angleWidth;
    this.x=x;
    this.y=y;
    this.velocity = velocity;
    this.transparency = 185;
    this.transparencyV = tV;
    this.width = 0;
    this.id = id;
    this.shockwaveID = shockwaveID;
}
Shockwave.prototype.move = function () {
    this.transparency -= this.transparencyV;
    this.width += this.velocity;
};

Shockwave.prototype.collision = function (p) {
    if (p.id == this.id) {
        return;
    }

    var angleToP = Math.atan2(p.y - this.y,p.x - this.x);
    var angleDifference = (angleToP - this.angle);
    if (p.z <= 0 && Math.abs(angleDifference) <= this.width/2 &&
    Math.abs(dist(this.x,this.y,p.x,p.y) - (this.xWidth/2 + 5)) < 10){
        p.vx = cos(this.angle) * 3;
        p.vy = sin(this.angle) * 3;
        p.life -= 5;
    }

};

/**
VICTORIA start
*/


/**
VICTORIA end
*/

/**MAREHAN/JELAN start*/

/**MAREHAN/JELAN end*/

// Loading socket.io
var io = require('socket.io').listen(server);



io.on('connection', function(socket){
  console.log('a user connected');
  io.emit("message", "A new user has joined the chat, pending name input");


    socket.on('disconnect', function(){
    disappearedUser = socketUserMap.get(socket);
    if (disappearedUser!= null){
      io.emit("message", disappearedUser.name + " has left the chat.");
      var userId = disappearedUser.id;
      console.log("disappeared user id:" + userId);
      var userIndex = -1;

      characters.delete(userId);
    }

    io.emit("delete user", userId);
      console.log('user disconnected');
    });

    socket.on('message', function(msg) {
        console.log(msg);
      io.emit("message", socketUserMap.get(socket).name + ": " + msg);
    });

    socket.on("update stats", function(id, score, life) {
      console.log(id);
      console.log(characters.size);
      var currentCharacter = characters.get(id);
      currentCharacter.score = score;
      currentCharacter.life = life;
    });



    socket.on("add shockwave", function(id, x, y, angle, angleWidth, velocity, tV) {
      console.log("Shockwave requested!");
      if (shockwaves.get(id) == null) {
            shockwaves.set(id, []);
      }
      else
      {
        shockwaves.get(id).push(new Shockwave(id, shockwaveCounter, x, y, angle, angleWidth, velocity, tV));
        shockwaveCounter++;
      }
      console.log("shockwave size: " + shockwaves.get(id).length) ;
    });

    socket.on("update position", function(id, x, y, z, r) {
      var currentCharacter = characters.get(id);
      currentCharacter.acceptPositionUpdate(x,y,z,r);
    });



    //NEW USER
    socket.on('name', function(name) {
        console.log("new user's name is" + name);
        idCounter++;
        var newUser = new User(idCounter, name, socket);
        socketUserMap.set(socket, newUser);
        characters.set(idCounter, newUser.character);


        socket.emit("init synchronization", idCounter);

        //update new user with info on the room's all players
        for (let [k, c] of characters) {
          socket.emit("update new character", k, c.name, c.x, c.y, c.z, c.r, c.velocity, c.score);
        }

        var nC = newUser.character;


        socket.emit("confirm updated", '');

        //Tell everybody who the new user's name is
        io.emit("message", "New user's name is: " + name + ". Welcome!");

        //update everybody (including new user) on new user's info
        io.emit("update new character", newUser.id, newUser.name, nC.x, nC.y, nC.z, nC.r, nC.velocity, nC.score);

        //makes new user set myCharacter variable
        socket.emit("set user myCharacter", true);


        /**VICTORIA start*/

        /**VICTORIA end*/
        console.log(characters.size);
    });
});



server.listen(40378);
console.log("Socket is listening!");


/**
Everything in here runs every frame of the game
*/
function gameSingleFrame() {

  /**
  VICTORIA start
  */

  /**
  VICTORIA end
  */

  for (let [k, c] of characters){
    //update all clients of all players
    io.emit("update stats", c.id, c.score, c.life);
    io.emit("update position", c.id, c.x, c.y, c.z, c.r, c.velocity);
  }


  //update all clients of all shockwaves
  for (let [ks, a] of shockwaves) {
    //ks is a shockwave list's key (ID)
    //a is a list of shockwaves with the same ID
    for (var i = 0; i < a.length; i++) {
      //loop through shockwaves in the list

      //s = individual shockwave
      var s = a[i];
      s.move();
      for (let [kc, c] of characters) {
        //kc = character's
        //c = individual character
        //s.collision(c);
      }
      io.emit("update shockwave", s.id, s.shockwaveID, s.x, s.y, s.angle, s.width, s.velocity, s.transparencyV);

    }

  }



}

//run above function once every 24 milliseconds
setInterval(gameSingleFrame, 24);
