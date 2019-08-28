import { resolveBackend, Backend } from '../backend';
import registry from 'Lib/registry';
import { Map, List } from 'immutable';

jest.mock('Lib/registry');

const configWrapper = inputObject => ({
  get: prop => inputObject[prop],
});

describe('Backend', () => {
  describe('filterEntries', () => {
    let backend;

    beforeEach(() => {
      registry.getBackend.mockReturnValue({
        init: jest.fn(),
      });
      backend = resolveBackend({
        getIn: jest.fn().mockReturnValue('git-gateway'),
      });
    });

    it('filters string values', () => {
      const result = backend.filterEntries(
        {
          entries: [
            {
              data: {
                testField: 'testValue',
              },
            },
            {
              data: {
                testField: 'testValue2',
              },
            },
          ],
        },
        configWrapper({ field: 'testField', value: 'testValue' }),
      );

      expect(result.length).toBe(1);
    });

    it('filters number values', () => {
      const result = backend.filterEntries(
        {
          entries: [
            {
              data: {
                testField: 42,
              },
            },
            {
              data: {
                testField: 5,
              },
            },
          ],
        },
        configWrapper({ field: 'testField', value: 42 }),
      );

      expect(result.length).toBe(1);
    });

    it('filters boolean values', () => {
      const result = backend.filterEntries(
        {
          entries: [
            {
              data: {
                testField: false,
              },
            },
            {
              data: {
                testField: true,
              },
            },
          ],
        },
        configWrapper({ field: 'testField', value: false }),
      );

      expect(result.length).toBe(1);
    });

    it('filters list values', () => {
      const result = backend.filterEntries(
        {
          entries: [
            {
              data: {
                testField: ['valueOne', 'valueTwo', 'testValue'],
              },
            },
            {
              data: {
                testField: ['valueThree'],
              },
            },
          ],
        },
        configWrapper({ field: 'testField', value: 'testValue' }),
      );

      expect(result.length).toBe(1);
    });
  });

  describe('search', () => {
    describe('identifier_field is not set', () => {
      it('should perform a fuzzy search on the title field', async () => {
        const { collections, entries } = getFixtures();

        const search = Backend.prototype.search.bind({
          listAllEntries: async () => entries,
        });

        const results = await search(collections, 'spoon');

        expect(results.entries.length).toBe(2);
        expect(results.entries[0].data.title).toBe('one spoon');
        expect(results.entries[1].data.title).toBe('three spoon');
      });
    });

    describe('identifier_field is set', () => {
      it('should perform a fuzzy search on the identifier_field', async () => {
        const { collections, entries } = getFixtures('level1.level2.deepnested');

        const search = Backend.prototype.search.bind({
          listAllEntries: async () => entries,
        });

        const results = await search(collections, 'bread');

        expect(results.entries.length).toBe(2);
        expect(results.entries[0].data.title).toBe('one spoon');
        expect(results.entries[1].data.title).toBe('two fork');
      });
    });
  });
});

function getFixtures(identifierField) {
  const entries = [
    {
      data: {
        title: 'one spoon',
        level1: {
          level2: {
            deepnested: 'bread',
          },
        },
      },
    },

    {
      data: {
        title: 'two fork',
        level1: {
          level2: {
            deepnested: 'bread',
          },
        },
      },
    },

    {
      data: {
        title: 'three spoon',
        level1: {
          level2: {
            deepnested: 'cheese',
          },
        },
      },
    },
  ];

  const collectionData = {
    name: 'dummyCollection',
    summary: '',
    fields: List([
      Map({
        name: 'title',
        widget: 'string',
      }),

      Map({
        name: 'level1',
        widget: 'object',
        fields: List([
          Map({
            name: 'level2',
            widget: 'object',
            fields: List([
              Map({
                name: 'deepnested',
                widget: 'string',
              }),
            ]),
          }),
        ]),
      }),
    ]),
  };

  if (identifierField) {
    collectionData.identifier_field = identifierField;
  }

  const collection = Map(collectionData);

  return {
    entries,
    collections: List([collection]),
  };
}
