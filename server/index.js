const http = require('http');
const config = require('./config');
const postHandler = require('./postHandler');
const urlHandler = require('./urlHandler');

const requestHandler = (request, response) => {
    const url = request.url;
    let postData = {};
    postHandler(request).then(data => {
        postData = data;
        return urlHandler(url);
    }).then(handler => {
        if(typeof handler !== 'function') {
            throw new Error('Handler is not a function');
        }
        return handler(url, postData);
    }).then(data => {
        response.writeHead(200, {'Content-Type': 'application/json'});
        const json = JSON.stringify(data);
        response.end(json);
    }).catch(e => {
        const statusCode = e.statusCode || 500;
        const json = JSON.stringify(e.json || {
            family: 'DdProxy',
            reason: 'Error',
            message: e.toString()
        });
        response.writeHead(statusCode, {'Content-Type': 'application/json'});
        response.end(json);
    });
}
const server = http.createServer(requestHandler);
const port = config.server.port;
server.listen(port, (err) => {
    if (err) {
        return console.log('Server error:', err)
    }
    console.log(`Dadata caching proxy server is listening on port ${port}`)
})
