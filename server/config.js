require('dotenv').config();

const { SERVER_PORT, DADATA_BASEURL, DADATA_TOKEN, REDIS_OPTIONS_URL, REDIS_EXPIRE } = process.env;
const defaultExpire = 60;

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
        expire: REDIS_EXPIRE || defaultExpire
    },
    urlMap: {
        '/suggestions/api/4_1/rs/findById/party': (REDIS_EXPIRE || defaultExpire) * 60 * 24 * 30 // month
    }
};