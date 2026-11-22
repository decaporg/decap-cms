import json from '../json';

describe('json', () => {
  describe('toFile', () => {
    it('should put keys missing from sorted keys after the sorted ones', () => {
      expect(json.toFile({ extra: 'x', c: 'c', a: 'a' }, ['a', 'b', 'c'])).toEqual(
        '{\n  "a": "a",\n  "c": "c",\n  "extra": "x"\n}',
      );
    });
  });
});
