import { createHashHistory } from 'history';
import { useRouterHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

let history = useRouterHistory(createHashHistory)({
  queryKey: false
});

const syncHistory = (store) => {
  history = syncHistoryWithStore(history, store);
};

export { syncHistory };
export default history;
