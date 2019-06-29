var socket = io.connect('http://shockwave-io.com:40378');
socket.on('message', function(message) {
    document.getElementById("messages").innerHTML += message +"<br/>";
});

var givenName = false;

function sendStuff() {
    
        var x = document.forms["chat"].elements[0].value;
    if (givenName) {
	    socket.emit("message", x);
    } else {
        socket.emit("name", x);
        document.getElementById("button").innerHTML = "Send message";
        givenName = true;
    }
    
}