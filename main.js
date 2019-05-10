const http = require('http');
const handleHTTPRequest = require('./handle_http_request');

const port = process.env.PORT || 5000;

const httpServer = http.createServer();
httpServer.listen(port);
console.log(`Listening on port ${port}`);

process.on('uncaughtException', function (err) {
    console.error(err.stack);
    console.log("Node NOT Exiting...");
});

httpServer.on('request', handleHTTPRequest);