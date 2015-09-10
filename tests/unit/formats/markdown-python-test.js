import Ember from 'ember';

import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('format:markdown-python', 'MarkdownPython', {});

test('it should convert a simple file with metadata and text', function(assert) {
  var format = this.subject();
  var fileContent = "title: test\ndescription: a test\n\n## This is Markdown\n\nStill in the body";

  var obj = format.fromFile(fileContent);
  assert.ok(obj);
  assert.equal(obj.title, "test");
  assert.equal(obj.description, "a test");
  assert.equal(obj.body, "## This is Markdown\n\nStill in the body");
});


test('it should convert a simple obejct to metadata and a body', function(assert) {
  var format = this.subject();
  var obj = {
    title: "A test object",
    description: "This is another field",
    number: 10,
    body: "## Hello\n\nWorld"
  };
  var fileContent = format.toFile(obj, {get: () => ""});

  assert.ok(fileContent);
  assert.equal(fileContent, "title: A test object\ndescription: This is another field\nnumber: 10\n\n## Hello\n\nWorld");
});
