import { v4 as uuid } from 'uuid';

export function createNonce() {
  const nonce = uuid();
  window.sessionStorage.setItem('decap-cms-auth', JSON.stringify({ nonce }));
  return nonce;
}

export function validateNonce(check) {
  const auth = window.sessionStorage.getItem('decap-cms-auth');
  const valid = auth && JSON.parse(auth).nonce;
  window.localStorage.removeItem('decap-cms-auth');
  return check === valid;
}

export function isInsecureProtocol() {
  return (
    document.location.protocol !== 'https:' &&
    // TODO: Is insecure localhost a bad idea as well? I don't think it is, since you are not actually
    //       sending the token over the internet in this case, assuming the auth URL is secure.
    document.location.hostname !== 'localhost' &&
    document.location.hostname !== '127.0.0.1'
  );
}
