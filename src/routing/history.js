import { createHashHistory } from 'history';
import { useRouterHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

const history = useRouterHistory(createHashHistory)({
  queryKey: false,
});

const getSyncedHistoryInstance =
  (historyInstance, store) => syncHistoryWithStore(historyInstance, store);

export { getSyncedHistoryInstance };
export default history;
