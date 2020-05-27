jest.spyOn(console, 'error').mockImplementation(() => {});

describe('registry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('registerLocale', () => {
    it('should log error when name is empty', () => {
      const { registerLocale } = require('../registry');

      registerLocale();
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "Locale parameters invalid. example: CMS.registerLocale('locale', phrases)",
      );
    });

    it('should log error when phrases are undefined', () => {
      const { registerLocale } = require('../registry');

      registerLocale('fr');
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "Locale parameters invalid. example: CMS.registerLocale('locale', phrases)",
      );
    });

    it('should register locale', () => {
      const { registerLocale, getLocale } = require('../registry');

      const phrases = {
        app: {
          header: {
            content: 'Inhalt',
          },
        },
      };

      registerLocale('de', phrases);

      expect(getLocale('de')).toBe(phrases);
    });
  });

  describe('eventHandlers', () => {
    const events = [
      'prePublish',
      'postPublish',
      'preUnpublish',
      'postUnpublish',
      'preSave',
      'postSave',
    ];

    describe('registerEventListener', () => {
      it('should throw error on invalid event', () => {
        const { registerEventListener } = require('../registry');

        expect(() => registerEventListener({ name: 'unknown' })).toThrow(
          new Error("Invalid event name 'unknown'"),
        );
      });

      events.forEach(name => {
        it(`should register '${name}' event`, () => {
          const { registerEventListener, getEventListeners } = require('../registry');

          const handler = jest.fn();
          registerEventListener({ name, handler });

          expect(getEventListeners(name)).toEqual([{ handler, options: {} }]);
        });
      });
    });

    describe('removeEventListener', () => {
      it('should throw error on invalid event', () => {
        const { removeEventListener } = require('../registry');

        expect(() => removeEventListener({ name: 'unknown' })).toThrow(
          new Error("Invalid event name 'unknown'"),
        );
      });

      events.forEach(name => {
        it(`should remove '${name}' event by handler`, () => {
          const {
            registerEventListener,
            getEventListeners,
            removeEventListener,
          } = require('../registry');

          const handler1 = jest.fn();
          const handler2 = jest.fn();
          registerEventListener({ name, handler: handler1 });
          registerEventListener({ name, handler: handler2 });

          expect(getEventListeners(name)).toHaveLength(2);

          removeEventListener({ name, handler: handler1 });

          expect(getEventListeners(name)).toEqual([{ handler: handler2, options: {} }]);
        });
      });

      events.forEach(name => {
        it(`should remove '${name}' event by name`, () => {
          const {
            registerEventListener,
            getEventListeners,
            removeEventListener,
          } = require('../registry');

          const handler1 = jest.fn();
          const handler2 = jest.fn();
          registerEventListener({ name, handler: handler1 });
          registerEventListener({ name, handler: handler2 });

          expect(getEventListeners(name)).toHaveLength(2);

          removeEventListener({ name });

          expect(getEventListeners(name)).toHaveLength(0);
        });
      });
    });

    describe('invokeEvent', () => {
      it('should throw error on invalid event', async () => {
        const { invokeEvent } = require('../registry');

        await expect(invokeEvent({ name: 'unknown', data: {} })).rejects.toThrow(
          new Error("Invalid event name 'unknown'"),
        );
      });

      events.forEach(name => {
        it(`should invoke '${name}' event with data`, async () => {
          const { registerEventListener, invokeEvent } = require('../registry');

          const options = { hello: 'world' };
          const handler = jest.fn();

          registerEventListener({ name, handler }, options);

          const data = { entry: {} };
          await invokeEvent({ name, data });

          expect(handler).toHaveBeenCalledTimes(1);
          expect(handler).toHaveBeenCalledWith(data, options);
        });
      });
    });
  });
});
