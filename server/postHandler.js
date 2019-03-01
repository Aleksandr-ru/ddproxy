module.exports = function (request) {
    return new Promise((resolve, reject) => {
        if (request.method === 'POST') {
            let body = '';
            request.on('data', chunk => {
                body += chunk.toString(); // convert Buffer to string
            });
            request.on('end', () => {
                const o = JSON.parse(body);
                resolve(o);
            });
        }
        else {
            reject('Unsupported method ' + request.method);
        }
    }); 
}