require('dotenv').config();

const { 
    APP_ID, 
    APP_LIMIT, 
    SERVER_PORT, 
    DADATA_BASEURL, 
    DADATA_TOKEN, 
    REDIS_OPTIONS_URL, 
    REDIS_EXPIRE, 
    REDIS_EXPIRE_INN, 
    REDIS_EXPIRE_EMPTY 
} = process.env;

const { isInnValid } = require('./helpers');

module.exports = {
    app: {
        id: APP_ID || 'default',
        limit: APP_LIMIT || 0,
    },
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
            // для кластера 'host:port,host:port,...'
        },
        expire: REDIS_EXPIRE || 60
    },
    urlMap: {
        '/suggestions/api/4_1/rs/findById/party': {
            /**
             * Функиця или цифра времени жизни кеша ответа от урл
             * Если ИНН валидный, но нет подсказок, счтаем его недавно зарегистрированным и кешируем ответ на короткий срок
             * @param {object} data запрос
             * @param {object} body ответ
             * @returns {int} seconds
             */        
            expire: function(data, body) { 
                return body && body.suggestions && body.suggestions.length === 0 && isInnValid(data.query)
                ? (REDIS_EXPIRE_EMPTY || (60 * 60 * 24)) // day
                : (REDIS_EXPIRE_INN || (60 * 60 * 24 * 30)); // month
            },
            /**
             * Функция для создания дополнителных ключей хранения данных
             * Если были подсказки в ответ на ИНН, то сохраняем их в ключе inn:<ИНН> для удобного поиска данных
             * @param {object} data запрос
             * @param {object} body ответ
             * @returns {string} "scope:value"
             */
            additionalKey: function(data, body) { 
                return body && body.suggestions && body.suggestions.length ? `inn:${data.query}` : ''; 
            }
        }
    }
};