

// _______________________________________________________
// basic server -- it listens, and serves
// _______________________________________________________
var express = require('express');
var portNo = 3002;

var app = express();

var server = app.listen(portNo);

app.use(express.static('public'));

console.log("my socket server is running on Port :: " + portNo);


// _______________________________________________________
// fancy socket server
// it 'upgrades' connection, listens for data and draws it
// _______________________________________________________

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection (socket) {
  console.log(' new connection: ' + socket.id);

  socket.on('mouse', mouseMsg);

  function mouseMsg(data){
    //send to all the other clients -- but not the source
    socket.broadcast.emit('mouse', data);
    // alt ::  send to all clients including echo to source
    //io.sockets.emit('mouse',data);
    //console.log(data);
  }

}
