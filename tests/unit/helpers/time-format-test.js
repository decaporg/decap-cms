import { timeFormat } from '../../../helpers/time-format';
import { module, test } from 'qunit';

module('Unit | Helper | time format');

// Replace this with your real tests.
test('formats dates with moment', function(assert) {
  var result = timeFormat(["Fri Feb 13 2015 16:00:00 GMT-0800 (PST)", "MMM Do YY"]);
  assert.equal("Feb 13th 15", result);
});
