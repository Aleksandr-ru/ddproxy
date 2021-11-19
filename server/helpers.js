const md5 = require('js-md5');

module.exports.makeHash = function(url, data) {
    const str = JSON.stringify({ url, data });
    return md5(str);
};

module.exports.formatSeconds = function(sec) {
    const hour = 60 * 60;
    const day = hour * 24;
    const month = day * 30;
    switch(true) {
        case sec >= month:
            return (sec / month).toFixed(1) + ' months';
        case sec >= day:
            return (sec / day).toFixed(1) + ' days';
        case sec >= hour:
            return (sec / hour).toFixed(1) + ' hours';
        default:
            return sec + ' seconds';
    }
};

module.exports.isInnValid = function(inn) {
    inn = String(inn).replace(/[^0-9]+/g, '').split('');
    if (inn.length == 10) {
        return inn[9] == String(((
            2 * inn[0] + 4 * inn[1] + 10 * inn[2] +
            3 * inn[3] + 5 * inn[4] + 9 * inn[5] +
            4 * inn[6] + 6 * inn[7] + 8 * inn[8]
        ) % 11) % 10);
    }
    else if (inn.length == 12) {
        return inn[10] == String(((
            7 * inn[0] + 2 * inn[1] + 4 * inn[2] +
            10 * inn[3] + 3 * inn[4] + 5 * inn[5] +
            9 * inn[6] + 4 * inn[7] + 6 * inn[8] +
            8 * inn[9]
        ) % 11) % 10) && inn[11] == String(((
            3 * inn[0] + 7 * inn[1] + 2 * inn[2] +
            4 * inn[3] + 10 * inn[4] + 3 * inn[5] +
            5 * inn[6] + 9 * inn[7] + 4 * inn[8] +
            6 * inn[9] + 8 * inn[10]
        ) % 11) % 10);
    }
    return false;
}

/**
 * Дата в локальной таймзоне
 * @returns {string} YYYY-MM-DD
 */
module.exports.getDate = function () {
    const dt = new Date();
    return dt.getFullYear() +
        '-' + ('0' + (dt.getMonth() + 1)).slice(-2) +
        '-' + ('0' + dt.getDate()).slice(-2);
}
