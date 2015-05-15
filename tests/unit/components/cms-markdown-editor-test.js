import {
  moduleForComponent,
  test
} from 'ember-qunit';

moduleForComponent('cms-markdown-editor', 'CmsMarkdownEditor', {
  // Specify the other units that are required for this test
  needs: ['component:cms-expanding-textarea']
});

test('undo/redo functionality', function() {
  // Creates the component instance
  var component = this.subject();
  equal(component._state, 'preRender');

  // Renders the component to the page
  this.append();
  equal(component._state, 'inDOM');

  Ember.run(() => {
    component.set("value", "hello ");
    component.set("value", "hello w");
    component.set("value", "hello wo");
  })

  equal(component.get("value"), "hello wo");
  equal(component._undoStack.length, 3);
  equal(component._redoStack.length, 0);
  Ember.run(() => {
    component.send("undo")
  })
  equal(component.get("value"), "hello w", "should have undone the last letter")
  equal(component._undoStack.length, 2);
  equal(component._redoStack.length, 1);
  equal(component._redoStack[0].value, "hello wo", "should have 'hello wo' in redo stack");

  Ember.run(() => {
    component.send("undo")
  })
  equal(component.get("value"), "hello ", "should have undone the last two letters");
  equal(component._undoStack.length, 1);
  equal(component._redoStack.length, 2);
  equal(component._redoStack[1].value, "hello w", "should have 'hello w' in redo stack");

  Ember.run(() => {
    component.send("redo")
  })
  equal(component.get("value"), "hello w", "should have redone the last letter");
  equal(component._undoStack.length, 2);
  equal(component._redoStack.length, 1);

  Ember.run(() => {
    component.send("undo")
  })
  equal(component.get("value"), "hello ", "should have undone the last redo");
  equal(component._undoStack.length, 1);
  equal(component._redoStack.length, 2);
});
