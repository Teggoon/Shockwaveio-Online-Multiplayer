var http = require('http');
var fs = require('fs');


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

function User (name, sock) {
    this.name = name;
    this.socket = sock;
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
  io.emit("message", "A user has left the chat.");
    console.log('user disconnected');
  });

});
  
io.on('connection', function(socket){
  socket.on('message', function(msg) {
      console.log(msg);
    io.emit("message", socketUserMap.get(socket).name + ": " + msg);
  });
});

io.on('connection', function(socket){
  socket.on('name', function(name) {
      console.log("new user's name is" + name);
      socketUserMap.set(socket, new User(name, socket));
      io.emit("message", "New user's name is: " + name + ". Welcome!");
  });
});


server.listen(40378);
console.log("Socket is listening!");