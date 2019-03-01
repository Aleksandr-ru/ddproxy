require('dotenv').config();

const { SERVER_PORT, DADATA_BASEURL, DADATA_TOKEN, REDIS_OPTIONS_URL, REDIS_EXPIRE } = process.env;

module.exports = {
    server: {
        port: SERVER_PORT || 3000,
    },
    daData: {
        baseUrl: DADATA_BASEURL || 'https://suggestions.dadata.ru',
        token: DADATA_TOKEN || 'MySuperSecretToken',
    },
    redis: {
        // https://github.com/NodeRedis/node_redis#rediscreateclient
        options: {
            url: REDIS_OPTIONS_URL || 'redis://127.0.0.1:6379', 
            // [redis[s]:]//[[user][:password@]][host][:port][/db-number]
        },
        expire: REDIS_EXPIRE || 60
    }
};