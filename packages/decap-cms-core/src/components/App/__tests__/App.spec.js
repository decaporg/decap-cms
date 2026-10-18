import { render } from '@testing-library/react';
import { fromJS } from 'immutable';
import { I18n } from 'react-polyglot';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../App';

/**
 * Regression cover for the wiring, not the rendering: at mount the config is
 * still loading, so both deploy thunks do nothing until the user arrives.
 */
function renderApp(props) {
  return render(
    <MemoryRouter>
      <I18n locale="en" messages={{}}>
        <App
          auth={{}}
          config={{ error: 'stop here', backend: {} }}
          collections={fromJS({})}
          loginUser={jest.fn()}
          logoutUser={jest.fn()}
          sessionInvalidated={jest.fn()}
          isFetching={false}
          openMediaLibrary={jest.fn()}
          startDeployNotifications={jest.fn()}
          startDeployStatus={jest.fn()}
          deployStatusVisible={false}
          t={key => key}
          {...props}
        />
      </I18n>
    </MemoryRouter>,
  );
}

describe('App deploy watching', () => {
  it('starts watching at mount', () => {
    const startDeployNotifications = jest.fn();
    const startDeployStatus = jest.fn();

    renderApp({ startDeployNotifications, startDeployStatus });

    expect(startDeployNotifications).toHaveBeenCalledTimes(1);
    expect(startDeployStatus).toHaveBeenCalledTimes(1);
  });

  it('retries once the user arrives, when a backend actually exists', () => {
    const startDeployNotifications = jest.fn();
    const startDeployStatus = jest.fn();

    const { rerender } = renderApp({ startDeployNotifications, startDeployStatus });

    rerender(
      <MemoryRouter>
        <I18n locale="en" messages={{}}>
          <App
            auth={{}}
            config={{ error: 'stop here', backend: {} }}
            collections={fromJS({})}
            loginUser={jest.fn()}
            logoutUser={jest.fn()}
            sessionInvalidated={jest.fn()}
            isFetching={false}
            openMediaLibrary={jest.fn()}
            startDeployNotifications={startDeployNotifications}
            startDeployStatus={startDeployStatus}
            deployStatusVisible={false}
            user={{ login: 'editor' }}
            t={key => key}
          />
        </I18n>
      </MemoryRouter>,
    );

    expect(startDeployStatus).toHaveBeenCalledTimes(2);
    expect(startDeployNotifications).toHaveBeenCalledTimes(2);
  });

  it('does not re-subscribe on every unrelated render', () => {
    const startDeployStatus = jest.fn();
    const props = {
      auth: {},
      config: { error: 'stop here', backend: {} },
      collections: fromJS({}),
      loginUser: jest.fn(),
      logoutUser: jest.fn(),
      sessionInvalidated: jest.fn(),
      isFetching: false,
      openMediaLibrary: jest.fn(),
      startDeployNotifications: jest.fn(),
      startDeployStatus,
      deployStatusVisible: false,
      user: { login: 'editor' },
      t: key => key,
    };

    const { rerender } = render(
      <MemoryRouter>
        <I18n locale="en" messages={{}}>
          <App {...props} />
        </I18n>
      </MemoryRouter>,
    );

    rerender(
      <MemoryRouter>
        <I18n locale="en" messages={{}}>
          <App {...props} isFetching />
        </I18n>
      </MemoryRouter>,
    );

    expect(startDeployStatus).toHaveBeenCalledTimes(1);
  });
});
