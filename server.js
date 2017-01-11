"use strict";

var fs = require('fs');

var SFTPServer = require("./node-sftp-server");

var srv = new SFTPServer();

srv.listen(8022);

console.log(process.env.USER);
console.log(process.env.PASSWORD);

srv.on("connect", function(auth){
    console.warn("authentication attempted");
    if(auth.method !== 'password' || auth.username !== process.env.USER || auth.password !== process.env.PASSWORD){
        return auth.reject();
    }
    var username = auth.username;
    var password = auth.password;

    return auth.accept(function(session){
        session.on("readdir", function(path, responder){
            console.warn("Readdir request for path: " + path);
            var files = fs.readdirSync(path);
            var x = 0;
            responder.on("dir", function(){
                if(files[x]){
                    responder.file(files[x++]);
                }
                else {
                    return responder.end();
                }
            });
            return responder.on("end", function(){
                return console.warn("Directory is done");
            });
        });
        session.on("realpath", function(path, callback){
            callback("/Users/" + username + "/")
        });
        session.on("readfile", function(path, writestream){
            console.log("File: " + path + " requested!");
            var readStream = fs.createReadStream(path);
            readStream.on('open', function(){
                readStream.pipe(writestream)
            });
            readStream.on('error', function(){
                console.log('readstream error');
            });
        });
        session.on("writefile", function(path, writestream){
            console.log(username, "attempted to write a file");
            session.emit('error', "You do not have permissions to write files");
            return 'error';
        });
        session.on("stat", function(path, statkind, statresponder) {
            fs.stat(path, function(err, stats){
                if (err){
                    return statresponder.nofile();
                }
                if(stats.isFile()){
                    statresponder.is_file();
                }
                else {
                    statresponder.is_directory();
                }
                return statresponder.file();
            });
        });
        session.on("error", function(err,path){
            console.log(err);
        });
    });
});
srv.on("error", function(err,path){
    console.log(err);
    console.log(path);
});
srv.on("end", function(){
    return console.warn("User Disconnected");
});
