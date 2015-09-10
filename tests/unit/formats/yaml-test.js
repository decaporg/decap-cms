import Ember from 'ember';
/* global moment */

import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('format:yaml', 'YAML', {});

test('it should convert a simple file with yaml', function(assert) {
  var format = this.subject();
  var fileContent = "title: test\ndescription: a test\ndate: 2015-02-10\nnumber: 10";

  var obj = format.fromFile(fileContent);
  assert.ok(obj);
  assert.equal(obj.title, "test");
  assert.equal(obj.description, "a test");
  assert.ok(obj.date instanceof Date);
  assert.equal(obj.number, 10);
});


test('it should convert a simple obejct to yaml', function(assert) {
  var format = this.subject();
  var obj = {
    title: "A test object",
    description: "This is another field",
    number: 10,
    date: moment("2015-02-10")
  };
  obj.date._f = "YYYY-MM-DD";
  var fileContent = format.toFile(obj, {get: () => ""});

  assert.ok(fileContent);
  assert.equal(fileContent, "title: A test object\ndescription: This is another field\nnumber: 10\ndate: 2015-02-10\n");
});
