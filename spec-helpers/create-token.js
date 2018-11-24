const jwt = require('jsonwebtoken');
const testSecret = require('./test-secret');

module.exports = (props = {}) => new Promise((resolve, reject) => {
    jwt.sign({ data: props.data || { foo: 'bar' } }, props.secret || testSecret, { expiresIn: props.exp || '1h' }, (err, token) => {
        if (err) return reject(err);
        return resolve(token);
    });
});
