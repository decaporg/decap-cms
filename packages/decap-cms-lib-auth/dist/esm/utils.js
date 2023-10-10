"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createNonce = createNonce;
exports.isInsecureProtocol = isInsecureProtocol;
exports.validateNonce = validateNonce;
var _uuid = require("uuid");
function createNonce() {
  const nonce = (0, _uuid.v4)();
  window.sessionStorage.setItem('decap-cms-auth', JSON.stringify({
    nonce
  }));
  return nonce;
}
function validateNonce(check) {
  const auth = window.sessionStorage.getItem('decap-cms-auth');
  const valid = auth && JSON.parse(auth).nonce;
  window.localStorage.removeItem('decap-cms-auth');
  return check === valid;
}
function isInsecureProtocol() {
  return document.location.protocol !== 'https:' &&
  // TODO: Is insecure localhost a bad idea as well? I don't think it is, since you are not actually
  //       sending the token over the internet in this case, assuming the auth URL is secure.
  document.location.hostname !== 'localhost' && document.location.hostname !== '127.0.0.1';
}