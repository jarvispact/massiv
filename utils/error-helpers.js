module.exports = {
    tokenError: message => ({ statusCode: 401, error: 'Unauthorized', message, code: 'E_TOKEN_VERIFY_ERROR' }),
    noHandlerError: { statusCode: 404, error: 'Not Found', message: 'Handler not Found', code: 'E_HANDLER_NOT_FOUND' },
    errorWithCode: boomError => ({ ...boomError.output.payload, code: boomError.output.payload.code || 'E_INTERNAL_SERVER_ERROR' }),
};
