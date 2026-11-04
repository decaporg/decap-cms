import json from '../json';

describe('json', () => {
  describe('toFile', () => {
    it('should keep the existing key order when no sorted keys are given', () => {
      expect(json.toFile({ b: 'b', a: 'a' })).toEqual('{\n  "b": "b",\n  "a": "a"\n}');
    });

    it('should order keys by sorted keys', () => {
      expect(json.toFile({ c: 'c', a: 'a', b: 'b' }, ['a', 'b', 'c'])).toEqual(
        '{\n  "a": "a",\n  "b": "b",\n  "c": "c"\n}',
      );
    });

    it('should put keys missing from sorted keys after the sorted ones', () => {
      expect(json.toFile({ extra: 'x', c: 'c', a: 'a' }, ['a', 'b', 'c'])).toEqual(
        '{\n  "a": "a",\n  "c": "c",\n  "extra": "x"\n}',
      );
    });

    it('should not change arrays', () => {
      expect(json.toFile(['b', 'a'], ['a', 'b'])).toEqual('[\n  "b",\n  "a"\n]');
    });
  });
});
