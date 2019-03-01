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