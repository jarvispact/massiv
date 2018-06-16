const Boom = require('boom');

module.exports = (type, message, code) => {
    if (!type) throw new Error('missing argument: "type"');
    if (!message) throw new Error('missing argument: "message"');
    if (!code) throw new Error('missing argument: "code"');
    if (!Boom[type]) throw new Error(`http error type: "${type}" invalid`);
    const error = Boom[type](message);
    error.code = code;
    error.output.payload.code = code;
    return error;
};
