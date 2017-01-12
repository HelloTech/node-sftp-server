"use strict";

var fs = require('fs');

var SFTPServer = require("../node-sftp-server");

var srv = new SFTPServer();

srv.listen(8022);

srv.on("connect", function(auth) {
  console.warn("authentication attempted");
  if (auth.method !== 'password' || auth.username !== "brady" || auth.password !== "test") {
    return auth.reject();
  }
  console.warn("We haven't *outhright* accepted yet...");
  var username = auth.username;
  var password = auth.password;

  return auth.accept(function(session) {
    console.warn("Okay, we've accepted, allegedly?");
    session.on("readdir", function(path, responder) {
      var dirs, i, j, results;
      console.warn("Readdir request for path: " + path);
      
      var i = 0;
      var dirs=[
        "denied",
        "nofile",
        "end",
        "fail",
        "bad_message",
        "unsupported",
      ];
      responder.on("dir", function() {
        if (dirs[i]) {
          console.warn("Returning directory: " + dirs[i]);
          responder.file(dirs[i]);
          return i++;
        } else {
          return responder.end();
        }
      });
      return responder.on("end", function() {
        return console.warn("Now I would normally do, like, cleanup stuff, for this directory listing");
      });
    });
    session.on("readfile", function(path, writestream) {
      return fs.createReadStream("/tmp/grumple.txt").pipe(writestream);
    });
    return session.on("writefile", function(path, readstream) {
      console.warn("PATH IS: "+path);
      var message=path.split("/")[1];
      readstream.status(message);
      /* Demo; manually handling 'chunks' instead of piping:
      readstream.on("data",function (chunk) {
        console.warn("HEY YOU WROTE ME SOME DATA: "+chunk);
      });
      readstream.on("end",function () {
        console.warn("HEY YOU ARE DONNNNNNEEEEEEEEEEE!!!!");
      });
      Results: it works, but 'end' never fires!!!
      */
      /* Original Demo:
      var something;
      something = fs.createWriteStream("/tmp/garbage");
      return readstream.pipe(something);
      */
    });
  });
});

srv.on("end", function() {
  return console.warn("Example says user disconnected");
});
