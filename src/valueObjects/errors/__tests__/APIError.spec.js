import APIError from '../APIError';

describe('valueObjects', () => {
  describe('errors', () => {
    describe('APIError', () => {

      it('should be constructed properly', () => {
        const message = 'TEST_MESSAGE';
        const status = 'TEST_STATUS';
        const api = 'TEST_API';
        const error = new APIError(message, status, api);
        
        expect(error.message).toEqual(message);
        expect(error.status).toEqual(status);
        expect(error.api).toEqual(api);
        expect(error.name).toEqual(APIError.name);
      });

    });
  });
});