import { Map, OrderedMap, fromJS } from 'immutable';
import uuid from 'uuid';
import * as actions from '../../actions/search';
import reducer from '../search';

const initialState = OrderedMap({ isFetching: Map({}), queryHits: Map({}) });

const collection = "page";
const searchFields = ["title"];
const searchTerm = "test";
const resultObject = { value: "value" };

describe('queries', () => {
  it('should mark queries as fetching', () => {
    const namespace = uuid.v4();
    expect(
      reducer(initialState, actions.querying(namespace, collection, searchFields, searchTerm))
    ).toEqual(
      OrderedMap(fromJS({
        isFetching: Map({
          [namespace]: Map({
            isFetching: true,
            term: searchTerm,
          }),
        }),
        queryHits: Map({}),
      }))
    );
  });

  it('should handle successful queries', () => {
    const namespace = uuid.v4();
    expect(
      reducer(initialState, actions.querySuccess(
        namespace,
        collection,
        searchFields,
        searchTerm,
        {
          query: searchTerm,
          hits: [
            resultObject,
          ],
        },
      ))
    ).toEqual(
      OrderedMap(fromJS({
        isFetching: Map({
          [namespace]: Map({
            isFetching: false,
            term: searchTerm,
          }),
        }),
        queryHits: Map({
          [namespace]: [
            resultObject,
          ],
        }),
      }))
    );
  });
});
