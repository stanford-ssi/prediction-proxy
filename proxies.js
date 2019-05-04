const axios = require('axios');
const zlib = require('zlib');
const { promisify } = require('util');
const LRU = require('lru-cache');

const CACHE_SIZE = 200;
const OPENROCKOON_URL = 'https://openrockoon.stanfordssi.org/predict';

const openRockoonCache = new LRU({
    max: CACHE_SIZE
});

/**
 * Proxies requests to openrockoon
 *
 * @param request
 * @param response
 * @param requestQuery
 * @return {Promise<void>}
 */
async function proxyOpenRockoon(request, response, requestQuery) {
    const cacheKey = hashOpenRockoonRequest(requestQuery);
    const cached = openRockoonCache.get(cacheKey);

    let resultPromise;

    if (cached) {
        resultPromise = cached;
    } else {
        const url = OPENROCKOON_URL + requestQuery.search;

        console.log(`Making request to ${url}`);
        resultPromise = axios.get(url);
        openRockoonCache.set(cacheKey, resultPromise);
    }

    const result = await resultPromise;
    let responseText = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
    const acceptEncoding = request.headers['accept-encoding'] || '';

    if (acceptEncoding.match(/\bdeflate\b/)) {
        response.setHeader('content-encoding', 'deflate');
        responseText = await promisify(zlib.deflate)(responseText);
    } else if (acceptEncoding.match(/\bgzip\b/)) {
        response.setHeader('content-encoding', 'gzip');
        responseText = await promisify(zlib.gzip)(responseText);
    }

    response.writeHead(result.status);
    response.end(responseText);
}

function proxyHabsim(request, response) {

}

/**
 * Hashes an open rockoon request to see if it's similar enough to be cached
 *
 * @param requestQuery
 * @return {String}
 */
function hashOpenRockoonRequest(requestQuery) {
    return requestQuery.search;
}

module.exports = {
    proxyOpenRockoon,
    proxyHabsim
};
