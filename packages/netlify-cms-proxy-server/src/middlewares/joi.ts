import express from 'express';
import Joi from 'joi';

const actions = [
  'entriesByFolder',
  'entriesByFiles',
  'getEntry',
  'unpublishedEntries',
  'unpublishedEntry',
  'deleteUnpublishedEntry',
  'persistEntry',
  'updateUnpublishedEntryStatus',
  'publishUnpublishedEntry',
  'getMedia',
  'getMediaFile',
  'persistMedia',
  'deleteFile',
  'getDeployPreview',
];

const defaultSchema = Joi.object({
  action: Joi.string()
    .allow(...actions)
    .required(),
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  params: Joi.when('action', {
    switch: [
      {
        is: 'entriesByFolder',
        then: Joi.object({
          folder: Joi.string().required(),
          extension: Joi.string().required(),
          depth: Joi.number().required(),
        }),
      },
      {
        is: 'entriesByFiles',
        then: Joi.object({
          files: Joi.array()
            .items(Joi.object({ path: Joi.string().required() }))
            .required(),
        }),
      },
      {
        is: 'getEntry',
        then: Joi.object({
          path: Joi.string().required(),
        }),
      },
      {
        is: 'unpublishedEntries',
        then: Joi.object({}),
      },
      {
        is: 'unpublishedEntry',
        then: Joi.object({
          collection: Joi.string().required(),
          slug: Joi.string().required(),
        }),
      },
      {
        is: 'deleteUnpublishedEntry',
        then: Joi.object({
          collection: Joi.string().required(),
          slug: Joi.string().required(),
        }),
      },
      {
        is: 'persistEntry',
        then: Joi.object({
          entry: Joi.object({ path: Joi.string().required() }),
        }),
      },
    ],
  }),
});

export const joi = (schema: Joi.Schema = defaultSchema) => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const { error } = Joi.validate(req.body, schema, { allowUnknown: true });
  const valid = error == null;

  if (valid) {
    next();
  } else {
    const { details } = error;
    const message = details.map(i => i.message).join(',');
    res.status(422).json({ error: message });
  }
};
