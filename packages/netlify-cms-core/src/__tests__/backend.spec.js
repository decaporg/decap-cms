import { resolveBackend } from '../backend';
import registry from 'Lib/registry';

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
          ],
        },
        configWrapper({ field: 'testField', value: 'testValue' }),
      );

      expect(result.length).toBe(1);
    });
  });
});
