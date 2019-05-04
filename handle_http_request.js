const {proxyOpenRockoon, proxyHabsim} = require('./proxies');

/**
 * Routes an HTTP request to the proper handler
 *
 * @param request
 * @param response
 */
function handleHTTPRequest(request, response) {
    response.setHeader("Access-Control-Allow-Origin", '*');

    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }

    const requestQuery = new URL(request.url, 'https://prediction-proxy.stanfordssi.org/');

    const action = {
        '/': rootHandler,
        '/spaceshot/rocket': proxyOpenRockoon,
        '/spaceshot/platform': proxyHabsim,
    }[requestQuery.pathname];

    if (!action || typeof action !== 'function') {
        response.writeHead(404);
        response.end();
    }

    action(request, response, requestQuery);
}

/**
 * GET /
 *
 * @param request
 * @param response
 */
function rootHandler(request, response) {
    response.writeHead(200);
    response.end(JSON.stringify({
        up: true
    }));
}

module.exports = handleHTTPRequest;
