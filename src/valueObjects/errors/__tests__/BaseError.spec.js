import BaseError from '../BaseError';


describe('APIError', () => {
  it('should create children whose name property is their class name.', () => {

    class ExtendedError extends BaseError {
        constructor(message) { 
            super(message)
        }
    }
    const message = 'TEST_MESSAGE'
    const error = new ExtendedError(message);
    expect(error.message).toEqual(message);
    expect(error.name).toEqual(ExtendedError.name);
    expect(error.name).not.toEqual(BaseError.name);
  });
});
