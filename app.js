var express = require('express')
  , app = express.createServer();

module.exports = require('./config.js').configure(app, express);

if (!module.parent) {

  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);

  var io = require('socket.io') // socket.io, I choose you
    , socket = io.listen(app)
    , roomManager = require('./lib/chatrooms.js')
    , room = roomManager.createRoom();

  socket.on('connection', function(client){
    console.log("CONNECTION", client.connection.remoteAddress);

    var user = roomManager.getUser(client);

    client.on('message', function(msg){ 
      console.log("MESSAGE", msg);

      var obj = JSON.parse(msg);

      user.processMessage(obj);

      if('hello' in obj) {
        user.joinRoom(room);
        client.send(JSON.stringify({ 'buffer': room.buffer }));
      }

    });

    client.on('disconnect', function(){ 
      roomManager.removeUser(client);
    });

  });

  room.on('roster-update', function() {
    socket.broadcast(JSON.stringify({ 'roster': this.roster }));
  });

  room.on('conversation-update', function(msg) {
    socket.broadcast(JSON.stringify({ 'speech': msg }));
  });

}