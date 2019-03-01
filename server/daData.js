const md5 = require('js-md5');
const redis = require('redis');
const request = require('request');
const config = require('./config');
const { formatSeconds } = require('./helpers');

const { redis: { options } } = config;
const client = redis.createClient(options);
client.on('error', (err) => {
    console.log('Redis error:', err);
});

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

function makeHash(url, data) {
    const str = JSON.stringify({ url, data });
    return md5(str);
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
        client.get(key, (err, result) => {
            if (result) {            
                console.log('Query %o found in cache by key %s', { url, data }, key);
                resolve(JSON.parse(result));
            }
            else {
                ddQuery(url, data).then(body => {
                    resolve(body);
                    client.setex(key, ttl, JSON.stringify(body));
                    console.log('Query %o cached for %s, key %s', { url, data }, formatSeconds(ttl), key);
                    if(urlMap[url] && urlMap[url].additionalKey && typeof urlMap[url].additionalKey === 'function') {
                        const additionalKey = urlMap[url].additionalKey(data);
                        if(typeof additionalKey === 'string' && additionalKey.match(/^[^:]+:[^:]+$/) /* a:b */) {
                            client.setex(additionalKey, ttl, key);
                            console.log('Additional key created %s', additionalKey);
                        }
                        else {
                            console.log('Additional key was not created');
                        }
                    }
                }, reject);
            }
        });
    });
}