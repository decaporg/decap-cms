export const ACCESS_TOKEN_ERROR = 'ACCESS_TOKEN_ERROR';

export default class AccessTokenError extends Error {
  message: string;

  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = ACCESS_TOKEN_ERROR;
  }
}
