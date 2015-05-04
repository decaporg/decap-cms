import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('format:markdown-frontmatter', 'FrontmatterFormat', {});

test('it should convert a simple file with frontmatter and text', function() {
  var format = this.subject();
  var fileContent = "---\ntitle: test\ndescription: a test\n---\n\n## This is Markdown\n\nStill in the body";

  var obj = format.fromFile(fileContent);
  ok(obj);
  equal(obj.title, "test");
  equal(obj.description, "a test");
  equal(obj.body, "## This is Markdown\n\nStill in the body");
});

test('it should convert a simple obejct to frontmatter and a body', function() {
  var format = this.subject();
  var obj = {
    title: "A test object",
    description: "This is another field",
    number: 10,
    body: "## Hello\n\nWorld"
  };
  var fileContent = format.toFile(obj, {get: () => ""});

  ok(fileContent);
  equal(fileContent, "---\ntitle: A test object\ndescription: This is another field\nnumber: 10\n---\n\n## Hello\n\nWorld");
});

test('it should handle a file with just a body', function() {
  var format = this.subject();
  var fileContent = "## This is just a plain markdown file";

  var obj = format.fromFile(fileContent);
  ok(obj);
  equal(obj.body, "## This is just a plain markdown file");
});
