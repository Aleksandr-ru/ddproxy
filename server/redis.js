const config = require('./config');
const redis = require('redis');
const redisClustr = require('redis-clustr');

const { redis: { options } } = config;
const redisUrls = options.url.split(',');
let client;
if (redisUrls.length > 1) {
    const servers = [];
    for(let s of redisUrls) {
        ss = s.split(':');
        servers.push({
            host: ss[0],
            port: ss[1]
        });        
    }
    delete options.url;
    client = new redisClustr({
        servers,
        redisOptions: options
    });
}
else {
    client = redis.createClient(options);
}
client.on('error', (err) => {
    console.log('Redis error:', err);
});

module.exports = client;