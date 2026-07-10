export const API_ERROR = 'API_ERROR';

export default class APIError extends Error {
  message: string;
  status: null | number;
  api: string;
  meta: {};

  constructor(message: string, status: null | number, api: string, meta = {}) {
    super(message);
    this.message = message;
    this.status = status;
    this.api = api;
    this.name = API_ERROR;
    this.meta = meta;
  }
}
