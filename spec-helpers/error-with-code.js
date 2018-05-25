const Boom = require('boom');

module.exports = (type = 'internal', message = 'Internal Server Error', code) => {
    const error = Boom[type] ? Boom[type](message) : Boom.internal(message);
    if (code) error.output.payload.code = code;
    return error;
};
