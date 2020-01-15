import express from 'express';
import Joi from '@hapi/joi';

const allowedActions = [
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

const requiredString = Joi.string().required();
const requiredNumber = Joi.number().required();
const requiredBool = Joi.bool().required();

const collection = requiredString;
const slug = requiredString;

export const defaultSchema = ({ path = requiredString } = {}) => {
  const asset = Joi.object({
    path,
    content: requiredString,
    encoding: requiredString.valid('base64'),
  });

  const params = Joi.when('action', {
    switch: [
      {
        is: 'entriesByFolder',
        then: Joi.object({
          folder: requiredString,
          extension: requiredString,
          depth: requiredNumber,
        }).required(),
      },
      {
        is: 'entriesByFiles',
        then: Joi.object({
          files: Joi.array()
            .items(Joi.object({ path }))
            .required(),
        }),
      },
      {
        is: 'getEntry',
        then: Joi.object({
          path,
        }).required(),
      },
      {
        is: 'unpublishedEntries',
        then: Joi.object({}).required(),
      },
      {
        is: 'unpublishedEntry',
        then: Joi.object({
          collection,
          slug,
        }).required(),
      },
      {
        is: 'deleteUnpublishedEntry',
        then: Joi.object({
          collection,
          slug,
        }).required(),
      },
      {
        is: 'persistEntry',
        then: Joi.object({
          entry: Joi.object({ path, raw: requiredString }),
          assets: Joi.array()
            .items(asset)
            .required(),
          options: {
            commitMessage: requiredString,
            useWorkflow: requiredBool,
            unpublished: requiredBool,
            status: requiredString,
          },
        }).required(),
      },
      {
        is: 'updateUnpublishedEntryStatus',
        then: Joi.object({
          collection,
          slug,
          newStatus: requiredString,
        }).required(),
      },
      {
        is: 'publishUnpublishedEntry',
        then: Joi.object({
          collection,
          slug,
        }).required(),
      },
      {
        is: 'getMedia',
        then: Joi.object({
          mediaFolder: requiredString,
        }).required(),
      },
      {
        is: 'getMediaFile',
        then: Joi.object({
          path,
        }).required(),
      },
      {
        is: 'persistMedia',
        then: Joi.object({
          asset,
        }).required(),
      },
      {
        is: 'deleteFile',
        then: Joi.object({
          path,
        }).required(),
      },
      {
        is: 'getDeployPreview',
        then: Joi.object({
          collection,
          slug,
        }).required(),
      },
    ],
    otherwise: Joi.forbidden(),
  });

  return Joi.object({
    action: Joi.valid(...allowedActions).required(),
    params,
  });
};

export const joi = (schema: Joi.Schema) => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const { error } = schema.validate(req.body, { allowUnknown: true });
  const valid = error == null;

  if (valid) {
    next();
  } else {
    const { details } = error;
    const message = details.map(i => i.message).join(',');
    res.status(422).json({ error: message });
  }
};
