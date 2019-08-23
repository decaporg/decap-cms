import { fromJS } from 'immutable';
import moment from 'moment';
import { createEmptyDraftData } from '../entries';

describe('entries', () => {
  describe('createEmptyDraftData', () => {
    it('should set default value for list field widget', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          field: { name: 'url', widget: 'text', default: 'https://image.png' },
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({ images: ['https://image.png'] });
    });

    it('should set default values for list fields widget', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          fields: [
            { name: 'title', widget: 'text', default: 'default image' },
            { name: 'url', widget: 'text', default: 'https://image.png' },
          ],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({
        images: [{ title: 'default image', url: 'https://image.png' }],
      });
    });

    it('should not set empty value for list fields widget', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          fields: [{ name: 'title', widget: 'text' }, { name: 'url', widget: 'text' }],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({});
    });

    it('should set default value for object field widget', () => {
      const fields = fromJS([
        {
          name: 'post',
          widget: 'object',
          field: { name: 'image', widget: 'text', default: 'https://image.png' },
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({ post: { image: 'https://image.png' } });
    });

    it('should set default values for object fields widget', () => {
      const fields = fromJS([
        {
          name: 'post',
          widget: 'object',
          fields: [
            { name: 'title', widget: 'text', default: 'default title' },
            { name: 'url', widget: 'text', default: 'https://image.png' },
          ],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({
        post: { title: 'default title', url: 'https://image.png' },
      });
    });

    it('should not set empty value for object fields widget', () => {
      const fields = fromJS([
        {
          name: 'post',
          widget: 'object',
          fields: [{ name: 'title', widget: 'text' }, { name: 'url', widget: 'text' }],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({});
    });

    it('should set current date as default value for date widget', () => {
      const now = new Date();
      const format = 'YYYY-MM-DD HH:mm';
      const formattedNow = moment(now).format(format);
      const fields = fromJS([
        {
          name: 'date',
          widget: 'date',
        },
        {
          name: 'date2',
          widget: 'date',
          format,
        },
      ]);

      jest.spyOn(global, 'Date').mockImplementation(() => now);

      expect(createEmptyDraftData(fields)).toEqual({ date: now, date2: formattedNow });
    });
  });
});
