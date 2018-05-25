const jwt = require('jsonwebtoken');
const testSecret = require('./test-secret');

module.exports = (props = {}) => jwt.sign({
    exp: props.exp || Math.floor(Date.now() / 1000) + (60 * 60),
    data: props.payload || { test: '42' },
}, props.secret || testSecret);
