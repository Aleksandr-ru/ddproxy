const daData = require('./daData');
const map = {
    '/suggestions/api/4_1/rs/findById/party': daData.getOrgByInn
};

module.exports = function(url) {
    const handlers = Object.keys(map);
    if(handlers.indexOf(url) + 1) {
        return map[url];
    }
    else {
        throw new Error('No handler for given url');
    }
}