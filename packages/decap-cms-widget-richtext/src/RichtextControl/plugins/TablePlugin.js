import { createSlatePlugin } from 'platejs';
import { toPlatePlugin } from 'platejs/react';

import TableElement from '../components/Element/TableElement';
import TableRowElement from '../components/Element/TableRowElement';
import TableCellElement from '../components/Element/TableCellElement';

const tablePlugin = createSlatePlugin({
  key: 'table',
  node: {
    isElement: true,
    component: TableElement,
  },
});

const tableRowPlugin = createSlatePlugin({
  key: 'table-row',
  node: {
    isElement: true,
    component: TableRowElement,
  },
});

const tableCellPlugin = createSlatePlugin({
  key: 'table-cell',
  node: {
    isElement: true,
    component: TableCellElement,
  },
});

const TablePlugin = toPlatePlugin(tablePlugin);
const TableRowPlugin = toPlatePlugin(tableRowPlugin);
const TableCellPlugin = toPlatePlugin(tableCellPlugin);

export { TablePlugin, TableRowPlugin, TableCellPlugin };
