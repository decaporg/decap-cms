import Ember from 'ember';

/**
@module app
@submodule mixins
*/

/*
  Adapted from: https://github.com/satchmorun/ember-shortcuts
*/

/* Lookup table for modifier keys */
var MODIFIERS = {
  '⇧': 16, shift: 16,
  '⌥': 18, alt: 18, option: 18,
  '⌃': 17, ctrl: 17, control: 17,
  '⌘': 91, command: 91
};

/* Lookup table for shortcut definitions */
var DEFINITIONS = {
  backspace: 8, tab: 9, clear: 12,
  enter: 13, 'return': 13,
  esc: 27, escape: 27, space: 32,
  left: 37, up: 38,
  right: 39, down: 40,
  del: 46, 'delete': 46,
  home: 36, end: 35,
  pageup: 33, pagedown: 34,
  ',': 188, '.': 190, '/': 191,
  '`': 192, '-': 189, '=': 187,
  ';': 186, '\'': 222,
  '[': 219, ']': 221, '\\': 220
};
for (var n = 1; n < 20; n++) {
  DEFINITIONS['f'+n] = 111 + n;
}

/* Helper function to get a charcode from a shortcut definition. */
function code(c) {
 return DEFINITIONS[c] || c.toUpperCase().charCodeAt(0);
}

/* Normalize keyCode for ⌘ */
function normalize(kc) {
  return (kc === 93 || kc === 224) ? 91 : kc;
}

/* helper method for determining if a keycode is a modifier key */
function isMod(kc) {
  return kc === 16 || kc === 17 || kc === 18 || kc === 91;
}

/* parse a shortcut definition */
function parse(component, key, action) {
  var parts = key.replace(/\s+/g, '').split('+');
  var kc = code(parts.pop());
  var m, mods = {};

  parts.forEach((part) => {
    if ((m = MODIFIERS[part])) {
      mods[m] = true;
    }
  });

  return { mods: mods, kc: kc, raw: key, action: action };
}

/**
  Add keyboard shortcut to a component.

  ## Usage:

  ```javascript
  export default Ember.Component.extend(KeyboardShortcuts, {
    shortcuts: {
      '⌘+s': 'save'
    },

    actions: {
      save: function() {
        // Gets triggered when the user press ⌘+s from within the component.
      }
    }
  });
  ```

  @class KeyboardShortcuts
  @extend Ember.Mixin
*/
export default Ember.Mixin.create({
  init: function() {
    this._super.apply(this, arguments);
    this._registered_shortcuts = [];
    this._reset();
    this._registerShortcut();
  },

  _registerShortcut: function() {
    if (!this.shortcuts) {
      return;
    }
    for (var key in this.shortcuts) {
      var def = parse(this, key, this.shortcuts[key]);
      this._registered_shortcuts[def.kc] = this._registered_shortcuts[def.kc] || [];
      this._registered_shortcuts[def.kc].push(def);
    }
  },

  _dispatchShortcut: function(event) {
    var kc = normalize(event.keyCode);

    this._pressed[kc] = true;

    if (isMod(kc)) {
      this._pressed_mods[kc] = true;
      return;
    }

    this._updatePressedMods(event, kc);

    if (!(kc in this._registered_shortcuts)) {
      return;
    }

    (this._registered_shortcuts[kc] || []).forEach((def) => {
      if (this._modsMatch(def)) {
        event.preventDefault();
        this.send(def.action);
      }
    });
  },

  _updatePressedMods: function(event) {
    if (event.shiftKey) { this._pressed_mods[16] = true; }
    if (event.ctrlKey)  { this._pressed_mods[17] = true; }
    if (event.altKey)   { this._pressed_mods[18] = true; }
    if (event.metaKey)  { this._pressed_mods[91] = true; }
  },

  _modsMatch: function(def) {
    var mods = def.mods;
    return mods[16] === this._pressed_mods[16] && mods[17] === this._pressed_mods[17] &&
           mods[18] === this._pressed_mods[18] && mods[91] === this._pressed_mods[91];
  },

  _clear: function(event) {
    var kc = normalize(event.keyCode);
    if (this._pressed[kc]) {
      this._pressed[kc] = undefined;
    }
    if (this._pressed_mods[kc]) {
      this._pressed_mods[kc] = undefined;
    }
  },

  _reset: function() {
    this._pressed = {};
    this._pressed_mods = {};
  },

  keyDown: function(e) {
    this._super.apply(this, arguments);
    this._dispatchShortcut(e);
  },
  keyUp: function(e) {
    this._super.apply(this, arguments);
    this._clear(e);
  },
  focus: function(e) {
    this._super.apply(this, arguments);
    this._reset(e);
  }

});
