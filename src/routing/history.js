import { createHashHistory } from 'history';
import { useRouterHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

// eslint-disable-next-line import/no-mutable-exports
let history = useRouterHistory(createHashHistory)({
  queryKey: false,
});

const syncHistory = (store) => {
  history = syncHistoryWithStore(history, store);
};

export { syncHistory };
export default history;
