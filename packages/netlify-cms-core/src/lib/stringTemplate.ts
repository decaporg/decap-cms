import moment from 'moment';
import { stringTemplate } from 'netlify-cms-lib-widgets';
import { selectInferedField } from '../reducers/collections';
import { EntryMap, Collection } from '../types/redux';

export const dateParsers = stringTemplate.dateParsers;
export const SLUG_MISSING_REQUIRED_DATE = stringTemplate.SLUG_MISSING_REQUIRED_DATE;
export const keyToPathArray = stringTemplate.keyToPathArray;
export const compileStringTemplate = stringTemplate.compileStringTemplate;
export const addFileTemplateFields = stringTemplate.addFileTemplateFields;

export function parseDateFromEntry(entry: EntryMap, collection: Collection, fieldName?: string) {
  const dateFieldName = fieldName || selectInferedField(collection, 'date');
  if (!dateFieldName) {
    return;
  }

  const dateValue = entry.getIn(['data', dateFieldName]);
  const dateMoment = dateValue && moment(dateValue);
  if (dateMoment && dateMoment.isValid()) {
    return dateMoment.toDate();
  }
}

export const extractTemplateVars = stringTemplate.extractTemplateVars;
