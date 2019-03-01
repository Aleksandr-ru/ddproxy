const redis = require('redis');
const request = require('request');
const config = require('./config');

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

module.exports.getOrgByInn = function(url, data) {
    const { redis: { expire } } = config;
    const inn = data.query;
    const key = `inn:${inn}`;
    if(!inn) {
        throw new Error('No inn in query');
    }
    return new Promise((resolve, reject) => {
        client.get(key, (err, result) => {
            if (result) {            
                console.log('Inn %s found in cache', inn);
                resolve(JSON.parse(result));
            }
            else {
                ddQuery(url, data).then(body => {
                    resolve(body);
                    client.setex(key, expire, JSON.stringify(body));
                    console.log('Inn %s is now cached', inn);
                }, reject);
            }
        });
    });
}