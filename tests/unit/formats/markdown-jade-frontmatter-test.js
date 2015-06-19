import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('format:markdown-jade-frontmatter', 'MarkdownJadeFrontmatterFormat', {
  needs: ['components:link-to']
});

test('it should convert a file with frontmatter and jade with a markdown block', function(assert) {
  var format = this.subject();
  var fileContent =
        "---\n" +
        "title: 'Hello world!'\n" +
        "date: 1/2/2014\n" +
        "_content: false\n" +
        "---\n\n" +
        "extends single_post_layout\n\n" +
        "block content\n" +
        "  :markdown\n" +
        "    This is my **first blog post** yaaaa!";
  var obj = format.fromFile(fileContent);

  assert.ok(obj);
  assert.equal(obj.title, "Hello world!");
  assert.equal(obj.jade_body, "extends single_post_layout\n\nblock content\n  :markdown\n    This is my **first blog post** yaaaa!");
  assert.equal(obj.body, "This is my **first blog post** yaaaa!");
});

test('it should convert an object to jade with frontmatter and a markdown block', function(assert) {
  var format = this.subject();
  var obj = {
    title: 'Hello World!',
    body: "This is my **first blog post** yaaaa!"
  };
  var fileContent = format.toFile(obj, {get: () => ""});

  assert.ok(fileContent);
  assert.equal(fileContent, "---\ntitle: \"Hello World!\"\n---\n\n:markdown\n  This is my **first blog post** yaaaa!");
});
