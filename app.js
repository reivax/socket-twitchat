var express = require('express')
  , app = express.createServer();

module.exports = require('./config.js').configure(app, express);

if (!module.parent) {

  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);

  var _ = require('underscore')
    , io = require('socket.io') // socket.io, I choose you
    , socket = io.listen(app)
    , roomManager = require('./lib/chatrooms.js')
    , room = roomManager.createRoom();


  /* ================================================================ managing clients */

  socket.on('connection', function(client){

    var user = roomManager.getUser(client);

    client.on('message', function(msg){ 
      console.log(">>>", msg);

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



  /* ================================================================ chatroom activity */

  room.on('roster-update', function() {
    socket.broadcast(JSON.stringify({ 'roster': this.roster }));
  });

  room.on('conversation-update', function(msg) {
    socket.broadcast(JSON.stringify({ 'speech': msg }));
  });



  /* ================================================================ tweet activity */

  setInterval(function() {
    socket.broadcast(JSON.stringify({ 'tweets': room.getTweets(1) }));
  }, 2222);

}