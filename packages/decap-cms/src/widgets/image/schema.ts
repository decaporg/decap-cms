import { mediaProcessingSchema } from '@/lib/util/mediaProcessing';

export default {
  properties: {
    allow_multiple: { type: 'boolean' },
    media_processing: mediaProcessingSchema,
    choose_url: { type: 'boolean' },
    private: { type: 'boolean' },
    media_library: {
      type: 'object',
      properties: {
        allow_multiple: { type: 'boolean' },
        config: { type: 'object' },
      },
    },
  },
};
