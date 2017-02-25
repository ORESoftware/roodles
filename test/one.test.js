#!/usr/bin/env node

const http = require('http');

const server = http.createServer(function (req, res) {
  setTimeout(function () {
    res.write('flowers');
    res.end();
  }, 100);
});

server.listen(3000, function () {

  console.log(' => Server is listening on port 3000');

  var exitCode;

  server.once('close', function(){
    process.exit(exitCode || 0);
  });

  process.once('SIGINT', function (code) {
    console.log('SIGINT received...');
    exitCode = 2;
    server.close();
  });

});

