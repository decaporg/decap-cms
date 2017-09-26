import { last } from 'lodash';

/**
 * Joins an array of regular expressions into a single expression, without
 * altering the received expressions.
 */
export function joinPatternSegments(patterns) {
  return patterns.map(p => p.source).join('');
}


/**
 * Combines an array of regular expressions into a single expression, wrapping
 * each in a non-capturing group and interposing alternation characters (|) so
 * that each expression is executed separately.
 */
export function combinePatterns(patterns, flags = '') {
  return patterns.map(p => `(?:${p.source})`).join('|');
}


/**
 * Modify substrings within a string if they match a (global) pattern. Can be
 * inverted to only modify non-matches.
 *
 * params:
 * matchPattern - regexp - a regular expression to check for matches
 * replaceFn - function - a replacement function that receives a matched
 *   substring and returns a replacement substring
 * text - string - the string to process
 * invertMatchPattern - boolean - if true, non-matching substrings are modified
 *   instead of matching substrings
 */
export function replaceWhen(matchPattern, replaceFn, text, invertMatchPattern) {
  /**
   * Splits the string into an array of objects with the following shape:
   *
   * {
   *   index: number - the index of the substring within the string
   *   text: string - the substring
   *   match: boolean - true if the substring matched `matchPattern`
   * }
   *
   * Loops through matches via recursion (`RegExp.exec` tracks the loop
   * internally).
   */
  function split(exp, text, acc) {
    /**
     * Get the next match starting from the end of the last match or start of
     * string.
     */
    const match = exp.exec(text);
    const lastEntry = last(acc);

    /**
     * `match` will be null if there are no matches.
     */
    if (!match) return acc;

    /**
     * If the match is at the beginning of the input string, normalize to a data
     * object with the `match` flag set to `true`, and add to the accumulator.
     */
    if (match.index === 0) {
      addSubstring(acc, 0, match[0], true);
    }

    /**
     * If there are no entries in the accumulator, convert the substring before
     * the match to a data object (without the `match` flag set to true) and
     * push to the accumulator, followed by a data object for the matching
     * substring.
     */
    else if (!lastEntry) {
      addSubstring(acc, 0, match.input.slice(0, match.index));
      addSubstring(acc, match.index, match[0], true);
    }

    /**
     * If the last entry in the accumulator immediately preceded the current
     * matched substring in the original string, just add the data object for
     * the matching substring to the accumulator.
     */
    else if (match.index === lastEntry.index + lastEntry.text.length) {
      addSubstring(acc, match.index, match[0], true);
    }

    /**
     * Convert the substring before the match to a data object (without the
     * `match` flag set to true), followed by a data object for the matching
     * substring.
     */
    else {
      const nextIndex = lastEntry.index + lastEntry.text.length;
      const nextText = match.input.slice(nextIndex, match.index);
      addSubstring(acc, nextIndex, nextText);
      addSubstring(acc, match.index, match[0], true);
    }

    /**
     * Continue executing the expression.
     */
    return split(exp, text, acc);
  }

  /**
   * Factory for converting substrings to data objects and adding to an output
   * array.
   */
  function addSubstring(arr, index, text, match = false) {
    arr.push({ index, text, match });
  }

  /**
   * Split the input string to an array of data objects, each representing a
   * matching or non-matching string.
   */
  const acc = split(matchPattern, text, []);

  /**
   * Process the trailing substring after the final match, if one exists.
   */
  const lastEntry = last(acc);
  if (!lastEntry) return replaceFn(text);

  const nextIndex = lastEntry.index + lastEntry.text.length;
  if (text.length > nextIndex) {
    acc.push({ index: nextIndex, text: text.slice(nextIndex) });
  }

  /**
   * Map the data objects in the accumulator to their string values, modifying
   * matched strings with the replacement function. Modifies non-matches if
   * `invertMatchPattern` is truthy.
   */
  const replacedText = acc.map(entry => {
    const isMatch = invertMatchPattern ? !entry.match : entry.match;
    return isMatch ? replaceFn(entry.text) : entry.text;
  });

  /**
   * Return the joined string.
   */
  return replacedText.join('');
}
