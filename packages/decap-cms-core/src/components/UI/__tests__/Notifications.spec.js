import { act, render, screen } from '@testing-library/react';
import { I18n } from 'react-polyglot';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import configureStore from 'redux-mock-store';

import Notifications from '../Notifications';

const mockStore = configureStore([]);

describe('Notifications', () => {
  afterEach(() => {
    act(() => toast.dismiss());
  });

  it('renders a success notification', async () => {
    const store = mockStore({
      notifications: {
        notifications: [{ id: '1', message: 'Entry saved', type: 'success' }],
      },
    });

    render(
      <Provider store={store}>
        <I18n locale="en" messages={{}}>
          <Notifications />
        </I18n>
      </Provider>,
    );

    expect(await screen.findByText('Entry saved')).toBeInTheDocument();
  });
});
