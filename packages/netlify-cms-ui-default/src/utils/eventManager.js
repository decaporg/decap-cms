const eventManager = {
  list: new Map(),

  on(event, callback) {
    this.list.has(event) || this.list.set(event, []);

    this.list.get(event).push(callback);

    return this;
  },

  off(event) {
    this.list.delete(event);
    return this;
  },

  emit(event, ...args) {
    if (!this.list.has(event)) {
      return false;
    }
    this.list
      .get(event)
      .forEach(callback => setTimeout(() => callback.call(null, ...args), 0));

    return true;
  }
};

export default eventManager;
