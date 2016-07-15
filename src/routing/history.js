import { createHistory } from 'history';
import { useRouterHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import basePath from './basePath';

let history = useRouterHistory(createHistory)({
  basename: basePath
});

const syncHistory = (store) => {
  history = syncHistoryWithStore(history, store);
};

export { syncHistory };
export default history;
