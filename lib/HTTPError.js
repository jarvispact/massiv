const Boom = require('boom');

module.exports = (type, message, code, data) => {
    if (!type) throw new Error('missing argument: "type"');
    if (!message) throw new Error('missing argument: "message"');
    if (!Boom[type]) throw new Error(`http error type: "${type}" invalid`);
    const error = Boom[type](message);

    if (code) {
        error.code = code;
        error.output.payload.code = code;
    }

    if (data) {
        error.data = data;
        error.output.payload.data = data;
    }

    return error;
};
