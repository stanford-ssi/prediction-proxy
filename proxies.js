const axios = require('axios');
const zlib = require('zlib');
const { promisify } = require('util');
const LRU = require('lru-cache');

const CACHE_SIZE = 200;
const OPENROCKOON_URL = 'https://openrockoon.stanfordssi.org/predict';
const HABSIM_URL = 'https://predict.stanfordssi.org/spaceshot';

const openRockoonCache = new LRU({
    max: CACHE_SIZE
});

const habsimCache = new LRU({
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
    const cacheKey = requestQuery.search;
    const url = OPENROCKOON_URL + requestQuery.search;

    await genericProxy({
        request,
        response,
        cache: openRockoonCache,
        cacheKey,
        url
    });
}

/**
 * Proxies requests to habsim
 *
 * @param request
 * @param response
 * @param requestQuery
 * @return {Promise<void>}
 */
async function proxyHabsim(request, response, requestQuery) {
    const cacheKey = requestQuery.search;
    const url = HABSIM_URL + requestQuery.search;

    await genericProxy({
        request,
        response,
        cache: habsimCache,
        cacheKey,
        url
    });
}

/**
 * Proxies requests to a given URL, handling caching and compression
 *
 * @param request
 * @param response
 * @param {LRU} cache
 * @param {String} cacheKey
 * @param {String} url
 * @return {Promise<void>}
 */
async function genericProxy({ request, response, cache, cacheKey, url}) {
    const cached = cache.get(cacheKey);

    let resultPromise;

    if (cached) {
        console.log('Serving from cache');
        resultPromise = cached;
    } else {
        console.log(`Making request to ${url}`);
        resultPromise = axios.get(url);
        cache.set(cacheKey, resultPromise);
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

    response.setHeader('Content-Type', 'application/json');
    response.writeHead(result.status);
    response.end(responseText);
}

module.exports = {
    proxyOpenRockoon,
    proxyHabsim
};
