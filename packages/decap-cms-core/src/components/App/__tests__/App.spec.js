import { render } from '@testing-library/react';
import { fromJS } from 'immutable';
import { I18n } from 'react-polyglot';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../App';

/**
 * Regression cover for the wiring, not the rendering.
 *
 * At mount there is no constructed backend — the config is still loading — so
 * both deploy thunks quietly do nothing. Measured on a real site: the Deploys
 * nav item never appeared, because the one read that establishes the site's
 * state never ran. The same gap left an A4b ledger unresumed after a reload
 * unless the editor happened to save again.
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

describe('App deploy status visibility', () => {
  it('registers no /deploys route for a backend that cannot report deploys', () => {
    // Every non-Turbo backend. The route and the nav item must not exist at
    // all — auto-hide is the default, see §A7.
    const { container } = renderApp({ deployStatusVisible: false });

    expect(container.querySelector('a[href*="deploys"]')).toBeNull();
  });
});
