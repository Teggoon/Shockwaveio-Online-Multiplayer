var http = require('http');
var fs = require('fs');


/**IMPORTANT GAME VARIABLES HERE*/
//KEVIN
const MAP_SIZE = 2000;
const HOLE_NUM = 30;
const RESPAWN_TIMER = 200;
const PLAYER_ROUGH_RADIUS = 14;

var canvasWidth = 1140;
var canvasHeight = 500;


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
var holes = [];

/**
@param: first item's x position
@param: first item's y position
@param: second item's x position
@param: second item's y position
@return the distance between them on the Cartesian plane
*/
//JELAN, KEVIN, VICTORIA
function dist(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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
    var spawnLocationX = 0;
    var spawnLocationY = 0;

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
}
Character.prototype.acceptPositionUpdate = function(x, y, z, r) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.r = r;
}

Character.prototype.checkDie = function() {
  if (this.life <= 0) {
    sendDeathToClient(this);
  }
};

Character.prototype.sendPositionUpdate = function() {
  io.emit("update position", this.id, this.x, this.y, this.z, this.r, this.velocity);
};

Character.prototype.sendPositionUpdateOVERRIDE = function() {
  io.emit("OVERRIDE position", this.id, this.x, this.y, this.z, this.r, this.velocity);
};

Character.prototype.sendStatusUpdate = function() {
  io.emit("update stats", this.id, this.score, this.life);
};


//JELAN, KEVIN
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
    console.log("angle to p: " + angleToP);
    console.log("my angle: " + this.angle);
    console.log("shockwave angle width: "+ this.angleWidth);
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
Shockwave.prototype.killOnClient = function() {
  io.emit("kill shockwave", this.id, this.shockwaveID);
};

/**
Function that sends all clients the info of the current shockwave
*/
Shockwave.prototype.updateOnClient = function() {
  //id, shockwaveID, x, y, angle, radius, velocity, tV
  io.emit("update shockwave", this.id, this.shockwaveID, this.x, this.y, this.angle, this.angleWidth, this.radius, this.velocity, this.transparency, this.transparencyV);
};

//JELAN, VICTORIA
var Hole = function(x,y,size) {
    this.x = x;
    this.y = y;
    this.size = size;
};
Hole.prototype.collideWithUser = function (character) {
/**VICTORIA start*/
    if ( (dist(this.x, this.y, character.x, character.y) <= this.size) && character.z <= 0){
    sendDeathToClient(character);
        return true;}
/**VICTORIA end*/
  return false;
};



/**MAREHAN/JELAN start*/

function checkCirclesIntersect( x1, y1, r1, x2, y2, r2){
	if (r1 + r2 == dist( x1, y1, x2, y2 )){
		// circles are tangent to each other and intersect at one point
		return 0;
	}
	else if ( r1 + r2 > dist (x1, y1, x2, y2 )){
		//circles intersect at two points
		return 1;
	}
	return -1; // circles dont intersect
}
function checkPointOnArc(x,y,shockwave){
	//determine if the point lies within the arc using center
	// of shockwave as the "origin" and angle of point
	cartesianX =  x - shockwave.x;
	cartesianY = y - shockwave.y;
	anglePoint = 180*Math.atan(cartesianY, cartesianX)/Math.PI;//convert to degree 
	// find end angle of arc in radiands using s = r0
	endAngle = (shockwave.radius * (shockwave.angle*Math.PI)/180 + shockwave.width) / shockwave.radius;
	endAngle = 180*endAngle/Math.PI; // convert to degrees
	if ( anglePoint >= shockwave.angle && anglePoint <= endAngle){
	return true;
	}
	else {
	return false;
	}
}
function shockwaveHoleCollide(shockwave, hole) {

//4 properties of the shockwave object can be modified in here would
//reflect on client end immediately:
//shockwave.radius
//shockwave.angleWidth
//shockwave.angle
//shockwave.transparency
// see https://stackoverflow.com/questions/3349125/circle-circle-intersection-points
	//check if circle with hole  and circle containing shockwave intersect
	intersecting =  (checkCirclesIntersect(hole.x, hole.y, hole.size/2, 
		shockwave.x, shockwave.y, shockwave.radius));
	// shockwave doesnt touch hole
	if ( intersecting == -1 ){
	// if the circles dont intersect, then neither will arc
	}
	//shockwave circle  touches hole
	else if ( intersecting == 0 ){
		// if circles are tanget then point of intersection is 
		// midway between center of arc and center is point of 
		// intersection so check if its part of shockwave
		midX = (hole.x + shockwave.x)/2;
		midY = (hole.y + shockwave.y)/2;
		if (checkPointOnArc (midX, midY) == true ){
			shockwave.killOnClient();
		}
	}
	//shockwave circle overlaps with hole	
	else if (intersecting == 1 ) {
		//points of intersection of overlapping circles given by 
		//x = x2 +- h( y1 - y0)/d
		//y = y2 +- h(x1 - x0)/d
		distance = (hole.x, hole.y, shockwave.x, shockwave.y)
		a = (Math.pow(shockwave.radius, 2) - Math.pow( hole.size/2, 2) +
			Math.pow (distance,2))/ (2*distance);
		h = Math.sqrt (Math.pow (shockwave.radius,2) - a*a);
		x2 = shockwave.x + a * ( hole.x - shockwave.x) / distance;
		y2 = shockwave.y + a * ( hole.y - shockwave.y) / distance;
		xIntersect1 = x2 + h * ( hole.y -  shockwave.y ) / distance;
		yIntersect1 = y2 + h * ( hole.x - shockwave.x ) / distance;
		xIntersect2 = x2 - h * ( hole.y -  shockwave.y ) / distance;
		yIntersect2 = y2 - h * ( hole.x - shockwave.x ) / distance;

		if (checkPointOnArc( xIntersect1, yIntersect1, shockwave ) == true
			 || checkPointOnArc ( xIntersect2, yIntersect2, shockwave) == true ){
		shockwave.killOnClient();
		}
	}
	//shockwave.killOnClient() ←- a void function of a shockwave that deletes a shockwave on the client’s end
}





/**MAREHAN/JELAN end*/







// Loading socket.io
var io = require('socket.io').listen(server);



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



server.listen(40378);
console.log("Socket is listening!");



function initHoles() {
  for (var i = 0; i < HOLE_NUM; i++){
    var halfDist = MAP_SIZE/2;
    var x = Math.random() * MAP_SIZE;
    var y = Math.random() * MAP_SIZE;
    var size = 50 + Math.random() * 100;
    //holes.push(new Hole(x, y, size));
  }
  holes.push(new Hole(200,200, 150));
};

function sendUserHoles(socket) {
  for (var i = 0; i < holes.length; i++) {
    socket.emit("add hole", holes[i].x, holes[i].y, holes[i].size);
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
        c.sendPositionUpdateOVERRIDE();
      } else if (c.x + PLAYER_ROUGH_RADIUS >  MAP_SIZE / 2) {
        c.x =  MAP_SIZE / 2 - PLAYER_ROUGH_RADIUS;
        c.vx = 0;
        c.sendPositionUpdateOVERRIDE();
      }
      if (c.y + PLAYER_ROUGH_RADIUS >  MAP_SIZE / 2) {
        c.y =  MAP_SIZE / 2 - PLAYER_ROUGH_RADIUS;
        c.vy = 0;
        c.sendPositionUpdateOVERRIDE();
      } else if (c.y - PLAYER_ROUGH_RADIUS  < -MAP_SIZE / 2) {
        c.y =  -MAP_SIZE / 2 + PLAYER_ROUGH_RADIUS;
        c.vy = 0;
        c.sendPositionUpdateOVERRIDE();
      }
}

/**
Everything in here runs every frame of the game
*/
function gameSingleFrame() {


  for (let [k, c] of characters){
    //update all clients of all players
    io.emit("update stats", c.id, c.score, c.life);
    c.sendPositionUpdate();
    containCharacterInMap(c);
    c.checkDie();

    for (var i = 0; i < holes.length; i ++) {
      holes[i].collideWithUser(c);
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
        shockwaveHoleCollide(s, holes[i]);
      }

      //dealing with collisions with characters, not yet implemented
      for (let [kc, c] of characters) {
        //kc = character's
        //c = individual character
        s.collision(c);
      }

      s.updateOnClient();


      //check whether to kill the current shockwave
      if (s.checkDie()) {
          s.killOnClient();
          a.splice(i, 1);
          i--;
          console.log(a.length);
      }
    }

  }




}






initHoles();

//run above function once every 24 milliseconds
setInterval(gameSingleFrame, 24);
