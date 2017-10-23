/**
 * BaseError used as the foundation for all exceptions, sets the .name property to the classname.
 */
export default class BaseError extends Error {
    /**
     * @param {string} message error message 
     */
    constructor(message) {
      super(message);
      this.name = this.constructor.name;
    }
  }