import AuthenticationPage from './AuthenticationPage';

export default class TestRepo {
  constructor(config) {
    this.config = config;
  }

  authComponent() {
    return AuthenticationPage;
  }

  authenticate(state) {
    return Promise.resolve({email: state.email});
  }
}
