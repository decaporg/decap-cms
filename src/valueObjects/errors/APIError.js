export const API_ERROR = 'API_ERROR';

export default class APIError extends Error {
  constructor(message, status, api, meta={}) {
    super(message);
    this.message = message;
    this.status = status;
    this.api = api;
    this.name = API_ERROR;
    this.meta = meta;
  }
}
