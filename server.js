// bwaaaaaa
var express = require('express')
  , app = express.createServer()
  , IS_PRODUCTION = process.env['NODE_ENV']=='production';

module.exports = require('./config.js').configure(app, express);

if (!module.parent) {

  app.listen(IS_PRODUCTION ? 80 : 3000);
  console.log("Express server listening on port %d", app.address().port);

  var _ = require('underscore')
    , io = require('socket.io') // socket.io, I choose you
    , socket = io.listen(app)
    , roomManager = require('./lib/manager.js')
    , room = roomManager.createRoom();


  /* ================================================================ managing clients */

  socket.on('connection', function(client){

    var user = roomManager.getUser(client);

    client.on('message', function(msg){ 
      console.log(">>>", msg);
      user.processMessage(JSON.parse(msg));
    });

    client.on('disconnect', function(){ 
      roomManager.removeUser(client);
    });

    var sendHelp = _.once(function() { user.processSlash(['help']); }); // send help automagically the first time

    user.on('name-update', function(me) {
      user.joinRoom(room);
      client.send(JSON.stringify({ 'buffer': room.buffer, 'topic': {what:room.topic}, 'join':me }));
      sendHelp();
    });

    user.on('slash-response', function(msg, cls) {
      client.send(JSON.stringify({ 'system': {msg:msg, addCls:cls} }));
    });

  });



  /* ================================================================ chatroom activity */

  room.on('topic-update', function(who) {
    socket.broadcast(JSON.stringify({ 'topic': {what:this.topic, who:who} }));
  });

  room.on('stream-stop', function(who) {
    socket.broadcast(JSON.stringify({ 'stop': {who:who}, 'topic': {what:this.topic+' (stopped)'} }));
  });

  room.on('roster-update', function(what, who) {
    var out = { 'roster': this.roster };
    out[what] = who; // fun!
    socket.broadcast(JSON.stringify(out));
  });

  room.on('conversation-update', function(msg) {
    socket.broadcast(JSON.stringify({ 'speech': msg }));
  });



  /* ================================================================ tweet activity */

  setInterval(function() {
    var tweets = room.getTweets();
    if(tweets.length) {
      socket.broadcast(JSON.stringify({ 'tweets': tweets }));
    }
  }, 1000);

}