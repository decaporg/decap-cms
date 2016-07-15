import { createHistory } from 'history';
import { useRouterHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

const base = document.querySelector('base');
let history = useRouterHistory(createHistory)({
  basename: base && base.href || ''
});

const syncHistory = (store) => {
  history = syncHistoryWithStore(history, store);
};

export { syncHistory };
export default history;
