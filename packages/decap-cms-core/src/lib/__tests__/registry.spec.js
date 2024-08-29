import { fromJS } from 'immutable';

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

  describe('registerCustomFormat', () => {
    it('can register a custom format', () => {
      const { getCustomFormats, registerCustomFormat } = require('../registry');

      expect(Object.keys(getCustomFormats())).not.toContain('querystring');

      registerCustomFormat('querystring', 'qs', {
        fromFile: content => Object.fromEntries(new URLSearchParams(content)),
        toFile: obj => new URLSearchParams(obj).toString(),
      });

      expect(Object.keys(getCustomFormats())).toContain('querystring');
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

          const data = { entry: fromJS({ data: {} }) };
          await invokeEvent({ name, data });

          expect(handler).toHaveBeenCalledTimes(1);
          expect(handler).toHaveBeenCalledWith(data, options);
        });

        it(`should invoke multiple handlers on '${name}`, async () => {
          const { registerEventListener, invokeEvent } = require('../registry');

          const options1 = { hello: 'test1' };
          const options2 = { hello: 'test2' };
          const handler = jest.fn(({ entry }) => entry.get('data'));

          registerEventListener({ name, handler }, options1);
          registerEventListener({ name, handler }, options2);

          const data = { entry: fromJS({ data: {} }) };
          await invokeEvent({ name, data });

          expect(handler).toHaveBeenCalledTimes(2);
          expect(handler).toHaveBeenLastCalledWith(data, options2);
        });

        it(`should throw error when '${name}' handler throws error`, async () => {
          const { registerEventListener, invokeEvent } = require('../registry');

          const handler = jest.fn(() => {
            throw new Error('handler failed!');
          });

          registerEventListener({ name, handler });
          const data = { entry: fromJS({ data: {} }) };

          await expect(invokeEvent({ name, data })).rejects.toThrow('handler failed!');
        });
      });

      it(`should return an updated entry's DataMap`, async () => {
        const { registerEventListener, invokeEvent } = require('../registry');

        const event = 'preSave';
        const options = { hello: 'world' };
        const handler1 = jest.fn(({ entry }) => {
          const data = entry.get('data');
          return data.set('a', 'test1');
        });
        const handler2 = jest.fn(({ entry }) => {
          const data = entry.get('data');
          return data.set('c', 'test2');
        });

        registerEventListener({ name: event, handler: handler1 }, options);
        registerEventListener({ name: event, handler: handler2 }, options);

        const data = {
          entry: fromJS({ data: { a: 'foo', b: 'bar' } }),
        };

        const dataAfterFirstHandlerExecution = {
          entry: fromJS({ data: { a: 'test1', b: 'bar' } }),
        };
        const dataAfterSecondHandlerExecution = {
          entry: fromJS({ data: { a: 'test1', b: 'bar', c: 'test2' } }),
        };

        const result = await invokeEvent({ name: event, data });

        expect(handler1).toHaveBeenCalledWith(data, options);
        expect(handler2).toHaveBeenCalledWith(dataAfterFirstHandlerExecution, options);

        expect(result).toEqual(dataAfterSecondHandlerExecution.entry.get('data'));
      });

      it('should allow multiple events to not return a value', async () => {
        const { registerEventListener, invokeEvent } = require('../registry');

        const event = 'prePublish';
        const options = { hello: 'world' };
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        registerEventListener({ name: event, handler: handler1 }, options);
        registerEventListener({ name: event, handler: handler2 }, options);

        const data = {
          entry: fromJS({ data: { a: 'foo', b: 'bar' } }),
        };
        const result = await invokeEvent({ name: event, data });

        expect(handler1).toHaveBeenCalledWith(data, options);
        expect(handler2).toHaveBeenCalledWith(data, options);
        expect(result).toEqual(data.entry.get('data'));
      });
    });
  });
});
