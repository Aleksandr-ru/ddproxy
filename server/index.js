const http = require('http');
const config = require('./config');
const postHandler = require('./postHandler');
const daData = require('./daData');

const requestHandler = (request, response) => {
    const url = request.url.replace(/\/$/, '');;
    postHandler(request).then(data => {
        return daData.query(url, data);
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
const { app: { id }} = config;
const server = http.createServer(requestHandler);
const port = config.server.port;
server.listen(port, (err) => {
    if (err) {
        return console.log('Server error:', err)
    }
    console.log(`Dadata caching proxy server [${id}] is listening on port ${port}`)
});
