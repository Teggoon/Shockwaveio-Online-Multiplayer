const express = require("express");

const app = express();
const http = require('http').Server(app);
const path = require("path");
const Shockwave = require("./class/Shockwave");
const User = require("./class/User");
const Hole = require("./class/Hole");

app.use('/static', express.static(path.join(__dirname, '../public')))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

var io = require('socket.io')(http);


/**IMPORTANT GAME VARIABLES HERE*/
//KEVIN
const MAP_SIZE = 2000;
const HOLE_NUM = 30;
const RESPAWN_TIMER = 200;
const PLAYER_ROUGH_RADIUS = 14;

var canvasWidth = 1140;
var canvasHeight = 500;

var socketUserMap = new Map();

var characters = new Map(); //map of each character

var shockwaves = new Map(); //map of all the shockwaves
var idCounter = 1; //counter for user's ID
var shockwaveCounter = 1; //counter for shockwave's ID
var holes = [];

/**MAREHAN/JELAN start*/

function shockwaveHoleCollide(shockwave, hole) {

//4 properties of the shockwave object can be modified in here would
//reflect on client end immediately:
//shockwave.radius
//shockwave.angleWidth
//shockwave.angle
//shockwave.transparency
}





/**MAREHAN/JELAN end*/



io.on('connection', function(socket){
  console.log('a user connected');


    socket.on('disconnect', function(){
    disappearedUser = socketUserMap.get(socket);
    if (disappearedUser!= null){
      io.emit("message", disappearedUser.name + " has left the chat.");
      var userId = disappearedUser.id;
      console.log("disappeared user id:" + userId);
      var userIndex = -1;

      characters.delete(userId);
      socketUserMap.delete(socket);
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
      //id, shockwaveID, x, y, angle, angleWidth, velocity, tV
      shockwaves.get(id).push(new Shockwave(id, shockwaveCounter, x, y, angle, angleWidth, velocity, tV));
      shockwaveCounter++;

      console.log("shockwave size: " + shockwaves.get(id).length) ;
    });

    socket.on("update position", function(id, x, y, z, r) {
      var currentCharacter = characters.get(id);
      if (currentCharacter != null) {
        currentCharacter.acceptPositionUpdate(x,y,z,r);
      }
    });



    //NEW USER
    socket.on('name', function(name) {
        console.log("new user's name is: " + name);
        console.log("server holes length: " + holes.length);
        idCounter++;
        var newUser = new User(idCounter, name, socket);
        socketUserMap.set(socket, newUser);
        characters.set(idCounter, newUser.character);


        socket.emit("init synchronization", idCounter, MAP_SIZE);

        //update new user with info on the room's all players
        for (let [k, c] of characters) {
          socket.emit("update new character", k, c.name, c.x, c.y, c.z, c.r, c.velocity, c.score);
        }

        var nC = newUser.character;


        socket.emit("confirm updated", '');

        //Tell everybody who the new user's name is
        io.emit("message", "" + name + " has joined the game.");

        //update everybody (including new user) on new user's info
        io.emit("update new character", newUser.id, newUser.name, nC.x, nC.y, nC.z, nC.r, nC.velocity, nC.score);

        //makes new user set myCharacter variable
        socket.emit("set user myCharacter", true);
        sendUserHoles(socket);

        console.log(characters.size);
    });

});



function initHoles() {
  for (var i = 0; i < HOLE_NUM; i++){
    var halfDist = MAP_SIZE/2;
    var x = Math.random() * MAP_SIZE - halfDist;
    var y = Math.random() * MAP_SIZE - halfDist;
    var radius = 30 + Math.random() * 70;
    holes.push(new Hole(x, y, radius));
  }
  holes.push(new Hole(200,200, 120));
};

function sendUserHoles(socket) {
  for (var i = 0; i < holes.length; i++) {
    socket.emit("add hole", holes[i].x, holes[i].y, holes[i].radius);
  }
}

/**
Function that takes in a character as a parameter
And removes this character from everywhere in the game (server + all clients)
*/
//VICTORIA
function sendDeathToClient (character) {
  console.log("sent user his/her death");
  character.user.socket.emit("your death", "");
  io.emit("delete user", character.id);
  characters.delete(character.id);
};


function containCharacterInMap(c) {
      if (c.x - PLAYER_ROUGH_RADIUS < -MAP_SIZE / 2) {
        c.x = -MAP_SIZE / 2 + PLAYER_ROUGH_RADIUS;
        c.vx = 0;
        c.sendPositionUpdateOVERRIDE(io);
      } else if (c.x + PLAYER_ROUGH_RADIUS >  MAP_SIZE / 2) {
        c.x =  MAP_SIZE / 2 - PLAYER_ROUGH_RADIUS;
        c.vx = 0;
        c.sendPositionUpdateOVERRIDE(io);
      }
      if (c.y + PLAYER_ROUGH_RADIUS >  MAP_SIZE / 2) {
        c.y =  MAP_SIZE / 2 - PLAYER_ROUGH_RADIUS;
        c.vy = 0;
        c.sendPositionUpdateOVERRIDE(io);
      } else if (c.y - PLAYER_ROUGH_RADIUS  < -MAP_SIZE / 2) {
        c.y =  -MAP_SIZE / 2 + PLAYER_ROUGH_RADIUS;
        c.vy = 0;
        c.sendPositionUpdateOVERRIDE(io);
      }
}

/**
Everything in here runs every frame of the game
*/
function gameSingleFrame() {


  for (let [k, c] of characters){
    //update all clients of all players
    io.emit("update stats", c.id, c.score, c.life);
    c.sendPositionUpdate(io);
    containCharacterInMap(c);
    c.checkDie(sendDeathToClient);

    for (var i = 0; i < holes.length; i ++) {
      const collidedWithUser = holes[i].checkCollisionWithUser(c);
      if (collidedWithUser) {
        sendDeathToClient(c);
      }
    }

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
      for (var j = 0; j < holes.length; j++) {
        shockwaveHoleCollide(s, holes[j]);
      }

      //dealing with collisions with characters, not yet implemented
      for (let [kc, c] of characters) {
        //kc = character's
        //c = individual character
        s.collision(c);
      }

      s.updateOnClient(io);


      //check whether to kill the current shockwave
      if (s.checkDie()) {
          s.killOnClient(io);
          a.splice(i, 1);
          i--;
      }
    }

  }




}






initHoles();

//run above function once every 24 milliseconds
setInterval(gameSingleFrame, 24);




http.listen(5000, function() {
   console.log('listening on *:5000');
})