const request = require('request');
const config = require('./config');
const redis = require('./redis');
const { makeHash, formatSeconds } = require('./helpers');

function checkLimit() {
    const { app: { id, limit }} = config;
    if (limit == 0 || limit == '') { // limit is string
        return Promise.resolve();
    }
    const date = new Date().toISOString().slice(0, 10);
    const key = `cnt:${id}:${date}`;
    return new Promise((resolve, reject) => {
        redis.get(key, (err, result) => {
            // не обрабатываем ошибку чтоб сервер продолжал работать даже если отвалился редис
            if (result && parseInt(result) >= parseInt(limit)) {
                console.log('Query limit %d reached for app %s', limit, id);
                reject(`Query limit reached, come back after midnight`);
            }
            else if (result) {
                redis.incr(key);
                resolve();
            }
            else {
                redis.setex(key, 86400 + 600, 1);
                resolve();
            }
        });
    });
}

function ddQuery(url, data) {
    const { daData: { baseUrl, token } } = config;
    return new Promise((resolve, reject) => {
        request({
            method: 'POST',
            url: baseUrl + url,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Token ' + token
            },
            json: data
        }, (error, response, body) => {
            if(error) {
                console.log('Dadata request error', error);
                throw new Error(error);
            }
            else if(response && response.statusCode !== 200) {
                console.log('Dadata response HTTP code', response.statusCode);
                let e = new Error('Dadata error');
                e.json = body;
                e.statusCode = response.statusCode;
                reject(e);
            }
            else {
                resolve(body);
            }
        });
    });
}

module.exports.query = function(url, data) {
    const { redis: { expire }, urlMap } = config;
    const hash = makeHash(url, data);
    const key = `q:${hash}`;
    const ttl = urlMap[url] && urlMap[url].expire || expire;
 
    if(!data.query) {
        throw new Error('No query in data');
    }
    return new Promise((resolve, reject) => {
        redis.get(key, (err, result) => {
            // не обрабатываем ошибку чтоб сервер продолжал работать даже если отвалился редис
            if (result) {            
                console.log('Query %o found in cache by key %s', { url, data }, key);
                resolve(JSON.parse(result));
            }
            else {
                checkLimit()
                .then(() => ddQuery(url, data))
                .then(body => {
                    resolve(body);
                    redis.setex(key, ttl, JSON.stringify(body));
                    console.log('Query %o cached for %s, key %s', { url, data }, formatSeconds(ttl), key);
                    if(urlMap[url] && typeof urlMap[url].additionalKey === 'function') {
                        const additionalKey = urlMap[url].additionalKey(data);
                        if(typeof additionalKey === 'string' && additionalKey.match(/^[^:]+:[^:]+$/) /* a:b */) {
                            redis.setex(additionalKey, ttl, key);
                            console.log('Additional key created %s', additionalKey);
                        }
                        else {
                            console.log('Additional key was not created');
                        }
                    }
                })
                .then(null, reject);
            }
        });
    });
}