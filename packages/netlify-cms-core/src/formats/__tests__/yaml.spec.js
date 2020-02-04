import yaml from '../yaml';

describe('yaml', () => {
  describe('fromFile', () => {
    test('loads valid yaml', () => {
      expect(yaml.fromFile('[]')).toEqual([]);
    });
    test('does not fail on closing separator', () => {
      expect(yaml.fromFile('---\n[]\n---')).toEqual([]);
    });
  });
  describe('toFile', () => {
    test('outputs valid yaml', () => {
      expect(yaml.toFile([])).toEqual('[]\n');
    });
  });
});
