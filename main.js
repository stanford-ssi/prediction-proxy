const http = require('http');
const handleHTTPRequest = require('./handle_http_request');

const port = process.env.PORT || 5000;

const httpServer = http.createServer();
httpServer.listen(port);
console.log(`Listening on port ${port}`);

httpServer.on('request', handleHTTPRequest);