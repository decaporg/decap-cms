import { getHtmlFragment, handlePasteHtml } from '../pasteHandler';

describe('pasteHandler', () => {
  describe('getHtmlFragment', () => {
    it('should return null when html is empty', () => {
      expect(getHtmlFragment('')).toBeNull();
    });

    it('should return slate root children as a fragment', () => {
      const deserialize = jest.fn(() => ({
        type: 'root',
        children: [{ type: 'p', children: [{ text: 'Hello world' }] }],
      }));

      expect(getHtmlFragment('<p>Hello world</p>', deserialize)).toEqual([
        { type: 'p', children: [{ text: 'Hello world' }] },
      ]);
      expect(deserialize).toHaveBeenCalledWith('<p>Hello world</p>');
    });
  });

  describe('handlePasteHtml', () => {
    function createEvent(html) {
      return {
        clipboardData: {
          getData: jest.fn(type => (type === 'text/html' ? html : '')),
        },
        preventDefault: jest.fn(),
      };
    }

    it('should ignore paste when editor is disabled', () => {
      const event = createEvent('<p>value</p>');
      const editor = { tf: { insertFragment: jest.fn() } };

      expect(handlePasteHtml({ event, editor, isDisabled: true })).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(editor.tf.insertFragment).not.toHaveBeenCalled();
    });

    it('should ignore paste when html is not present', () => {
      const event = createEvent('');
      const editor = { tf: { insertFragment: jest.fn() } };

      expect(handlePasteHtml({ event, editor, isDisabled: false })).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(editor.tf.insertFragment).not.toHaveBeenCalled();
    });

    it('should insert parsed fragment with insertFragment when available', () => {
      const event = createEvent('<p>value</p>');
      const editor = { tf: { insertFragment: jest.fn() } };
      const deserialize = jest.fn(() => ({
        type: 'root',
        children: [{ type: 'p', children: [{ text: 'value' }] }],
      }));

      expect(handlePasteHtml({ event, editor, isDisabled: false, deserialize })).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(editor.tf.insertFragment).toHaveBeenCalledWith([
        { type: 'p', children: [{ text: 'value' }] },
      ]);
    });

    it('should fall back to insertNodes when insertFragment is not available', () => {
      const event = createEvent('<p>value</p>');
      const editor = { tf: { insertNodes: jest.fn() } };
      const deserialize = jest.fn(() => ({
        type: 'root',
        children: [{ type: 'p', children: [{ text: 'value' }] }],
      }));

      expect(handlePasteHtml({ event, editor, isDisabled: false, deserialize })).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(editor.tf.insertNodes).toHaveBeenCalledWith([
        { type: 'p', children: [{ text: 'value' }] },
      ]);
    });
  });
});
