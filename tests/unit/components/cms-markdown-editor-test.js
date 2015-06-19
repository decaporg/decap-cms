import Ember from 'ember';

import {
  moduleForComponent,
  test
} from 'ember-qunit';

moduleForComponent('cms-markdown-editor', 'CmsMarkdownEditor', {
  // Specify the other units that are required for this test
  needs: ['component:cms-expanding-textarea', 'component:link-to']
});

test('undo/redo functionality', function(assert) {
  // Creates the component instance
  var component = this.subject();
  assert.equal(component._state, 'preRender');

  // Renders the component to the page
  this.append();
  assert.equal(component._state, 'inDOM');

  Ember.run(() => {
    component.set("value", "hello ");
    component.set("value", "hello w");
    component.set("value", "hello wo");
  });

  assert.equal(component.get("value"), "hello wo");
  assert.equal(component._undoStack.length, 3);
  assert.equal(component._redoStack.length, 0);
  Ember.run(() => {
    component.send("undo");
  });
  assert.equal(component.get("value"), "hello w", "should have undone the last letter");
  assert.equal(component._undoStack.length, 2);
  assert.equal(component._redoStack.length, 1);
  assert.equal(component._redoStack[0].value, "hello wo", "should have 'hello wo' in redo stack");

  Ember.run(() => {
    component.send("undo");
  });
  assert.equal(component.get("value"), "hello ", "should have undone the last two letters");
  assert.equal(component._undoStack.length, 1);
  assert.equal(component._redoStack.length, 2);
  assert.equal(component._redoStack[1].value, "hello w", "should have 'hello w' in redo stack");

  Ember.run(() => {
    component.send("redo");
  });
  assert.equal(component.get("value"), "hello w", "should have redone the last letter");
  assert.equal(component._undoStack.length, 2);
  assert.equal(component._redoStack.length, 1);

  Ember.run(() => {
    component.send("undo");
  });
  assert.equal(component.get("value"), "hello ", "should have undone the last redo");
  assert.equal(component._undoStack.length, 1);
  assert.equal(component._redoStack.length, 2);
});
