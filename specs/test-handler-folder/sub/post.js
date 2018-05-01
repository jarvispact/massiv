module.exports.handler = async ({ params, query, body }) => ({ status: 200, response: { params, query, body } });
