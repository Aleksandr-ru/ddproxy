const request = require('request');
const config = require('./config');
const redis = require('./redis');
const { makeHash, formatSeconds, getDate } = require('./helpers');

function counterKey(date)
{
    const { app: { id }} = config;
    return `cnt:${id}:${date}`;
}

function checkLimit(date) {
    const { app: { id, limit }} = config;
    if (limit == 0 || limit == '') { // limit is string
        return Promise.resolve();
    }
    const key = counterKey(date);
    return new Promise((resolve, reject) => {
        redis.get(key, (err, result) => {
            if (err) {
                // не обрабатываем ошибку чтоб сервер продолжал работать даже если отвалился редис
                console.log(err);
            }
            if (result && parseInt(result) >= parseInt(limit)) {
                console.log('Query limit %d reached for app %s', limit, id);
                reject(`Query limit reached, come back after midnight`);
            }
            else if (result === null) {
                redis.setex(key, 86400 + 600, 0);
                resolve();
            }
            else {
                // инкремент только после успешного запроса
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
    const ttlFn = urlMap[url] && urlMap[url].expire || expire;
    const keyFn = urlMap[url] && urlMap[url].additionalKey;
    const queryDate = getDate();
 
    if(!data.query) {
        throw new Error('No query in data');
    }
    return new Promise((resolve, reject) => {
        redis.get(key, (err, result) => {
            if (err) {
                // не обрабатываем ошибку чтоб сервер продолжал работать даже если отвалился редис
                console.log(err);
            }
            if (result) {            
                console.log('Query %o found in cache by key %s', { url, data }, key);
                resolve(JSON.parse(result));
            }
            else {
                checkLimit(queryDate)
                .then(() => ddQuery(url, data))
                .then(body => {
                    resolve(body);

                    // запрос успешен, увеличиваем счетчик
                    const cntKey = counterKey(queryDate);
                    redis.incr(cntKey);

                    const ttl = (typeof ttlFn === 'function') ? ttlFn(data, body) : ttlFn;
                    redis.setex(key, ttl, JSON.stringify(body));
                    console.log('Query %o cached for %s, key %s', { url, data }, formatSeconds(ttl), key);
                    if(typeof keyFn === 'function') {
                        const additionalKey = keyFn(data, body);
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
