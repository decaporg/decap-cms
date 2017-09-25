import NotUnderEditorialWorkflowError from '../NotUnderEditorialWorkflowError'

describe('NotUnderEditorialWorkflowError', () => {

  it('should be constructed properly', () => {
    const message = 'TEST_MESSAGE';
    const error = new NotUnderEditorialWorkflowError(message);
    expect(error.message).toEqual(message);
    expect(error.name).toEqual(NotUnderEditorialWorkflowError.name);
  });

});
