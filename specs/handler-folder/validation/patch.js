module.exports = async ({ query, params, body }) => ({ query, params, body });
module.exports.config = { auth: false };
module.exports.schema = {
    properties: {
        query: {
            type: 'object',
            properties: {
                test: { type: 'string' },
            },
            required: ['test'],
        },
        body: {
            type: 'object',
            properties: {
                test: { type: 'string' },
            },
            required: ['test'],
        },
    },
};
