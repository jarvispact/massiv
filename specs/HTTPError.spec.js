const { HTTPError } = require('../');

test('it should throw if argument "type" is missing', () => {
    const getError = () => HTTPError();
    expect(getError).toThrowError('missing argument: "type"');
});

test('it should throw if argument "message" is missing', () => {
    const getError = () => HTTPError('badRequest');
    expect(getError).toThrowError('missing argument: "message"');
});

test('it should throw if argument "code" is missing', () => {
    const getError = () => HTTPError('badRequest', 'a message');
    expect(getError).toThrowError('missing argument: "code"');
});

test('it should throw if argument "type" is invalid', () => {
    const getError = () => HTTPError('invalidType', 'a message', 'E_CODE');
    expect(getError).toThrowError('http error type: "invalidType" invalid');
});

test('it should return a http error object', () => {
    const error = HTTPError('badRequest', 'a message', 'E_CODE');
    expect(error.output.payload).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'a message',
        code: 'E_CODE',
    });
});
