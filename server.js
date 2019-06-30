var http = require('http');
var fs = require('fs');

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

var characters = new Map();
var idCounter = 1;

function User (id, name, sock) {
    this.name = name;
    this.socket = sock;
    this.id = id;
    var spawnLocationX = Math.random() * canvasWidth;
    var spawnLocationY = Math.random() * canvasHeight;
    this.character = new Character(id, name, this, spawnLocationX, spawnLocationY);
    this.score = 0;
}

function Character (id, name, user, x, y) {
    this.id = id;
    this.user = user;
    this.x = x;
    this.y = y;
    this.score = 0;
    this.name = name;
    this.vx = 0;
    this.vy = 0;
    this.velocity = 10;
}

// Loading socket.io
var io = require('socket.io').listen(server);

// When a client connects, we note it in the console
/*io.sockets.on('connection', function (socket) {
    console.log('A client is connected to the socket!');
    socket.emit("message", "Welcome client, this is the server.");
});
*/

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

    socket.on("update score", function(id, score) {
      console.log(id);
      console.log(characters.size);
        characters.get(id).score = score;
    });

    socket.on("user move up", function(index){

    });

    socket.on('name', function(name) {
        console.log("new user's name is" + name);
        idCounter++;
        var newUser = new User(idCounter, name, socket);
        socketUserMap.set(socket, newUser);
        characters.set(idCounter, newUser.character);


        socket.emit("init synchronization", idCounter);

        for (let [k, v] of characters) {
          var currentCharacter = v;
          socket.emit("update character", k, currentCharacter.name, currentCharacter.x, currentCharacter.y, currentCharacter.velocity, currentCharacter.score);
        }


        socket.on("update position", function(id, x, y) {
          characters.get(id).x = x;
          characters.get(id).y = y;
        });

        socket.emit("confirm updated", '');

        io.emit("message", "New user's name is: " + name + ". Welcome!");
        io.emit("update character", newUser.id, newUser.name, newUser.character.x, newUser.character.y, newUser.character.velocity, newUser.character.score);

        socket.emit("set user myCharacter", true);


        console.log(characters.size);
    });
});



server.listen(40378);
console.log("Socket is listening!");

function gameSingleFrame() {
  for (let [k, v] of characters){
    var currentCharacter = v;
    io.emit("update character", currentCharacter.id, currentCharacter.name, currentCharacter.x, currentCharacter.y, currentCharacter.velocity, currentCharacter.score);
  }
}

setInterval(gameSingleFrame, 33);
