import Ember from 'ember';

class TestClass {
  testing() {
    var a = ((b) => { `Hello ${b}`; });
    return a("Mathias");
  }  
}

export default Ember.Controller.extend({});