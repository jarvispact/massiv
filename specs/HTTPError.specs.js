const { expect } = require('chai');
const { HTTPError } = require('../');

describe('HTTPError', () => {
    it('should throw if argument "type" is missing', () => {
        const getError = () => HTTPError();
        expect(getError).to.throw('missing argument: "type"');
    });

    it('should throw if argument "message" is missing', () => {
        const getError = () => HTTPError('badRequest');
        expect(getError).to.throw('missing argument: "message"');
    });

    it('should throw if argument "type" is invalid', () => {
        const getError = () => HTTPError('invalidType', 'a message', 'E_CODE');
        expect(getError).to.throw('http error type: "invalidType" invalid');
    });

    it('should return a http error object', () => {
        const error = HTTPError('badRequest', 'a message');
        expect(error.output.payload).to.eql({
            statusCode: 400,
            error: 'Bad Request',
            message: 'a message',
        });
    });

    it('should return a http error object with a error code', () => {
        const error = HTTPError('badRequest', 'a message', 'E_CODE');
        expect(error.output.payload).to.eql({
            statusCode: 400,
            error: 'Bad Request',
            message: 'a message',
            code: 'E_CODE',
        });
    });

    it('should return a http error object with additional data', () => {
        const error = HTTPError('badRequest', 'a message', 'E_CODE', { foo: 'bar' });
        expect(error.output.payload).to.eql({
            statusCode: 400,
            error: 'Bad Request',
            message: 'a message',
            code: 'E_CODE',
            data: { foo: 'bar' },
        });
    });
});
