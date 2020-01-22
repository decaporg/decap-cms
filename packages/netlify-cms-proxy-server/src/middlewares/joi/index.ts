import express from 'express';
import Joi from '@hapi/joi';

const allowedActions = [
  'info',
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
  const defaultParams = Joi.object({
    branch: requiredString,
  });

  const asset = Joi.object({
    path,
    content: requiredString,
    encoding: requiredString.valid('base64'),
  });

  const params = Joi.when('action', {
    switch: [
      {
        is: 'info',
        then: Joi.allow(),
      },
      {
        is: 'entriesByFolder',
        then: defaultParams
          .keys({
            folder: path,
            extension: requiredString,
            depth: requiredNumber,
          })
          .required(),
      },
      {
        is: 'entriesByFiles',
        then: defaultParams.keys({
          files: Joi.array()
            .items(Joi.object({ path }))
            .required(),
        }),
      },
      {
        is: 'getEntry',
        then: defaultParams
          .keys({
            path,
          })
          .required(),
      },
      {
        is: 'unpublishedEntries',
        then: defaultParams.keys({ branch: requiredString }).required(),
      },
      {
        is: 'unpublishedEntry',
        then: defaultParams
          .keys({
            collection,
            slug,
          })
          .required(),
      },
      {
        is: 'deleteUnpublishedEntry',
        then: defaultParams
          .keys({
            collection,
            slug,
          })
          .required(),
      },
      {
        is: 'persistEntry',
        then: defaultParams
          .keys({
            entry: Joi.object({ slug: requiredString, path, raw: requiredString }).required(),
            assets: Joi.array()
              .items(asset)
              .required(),
            options: Joi.object({
              collectionName: Joi.string(),
              commitMessage: requiredString,
              useWorkflow: requiredBool,
              status: requiredString,
            }).required(),
          })
          .required(),
      },
      {
        is: 'updateUnpublishedEntryStatus',
        then: defaultParams
          .keys({
            collection,
            slug,
            newStatus: requiredString,
          })
          .required(),
      },
      {
        is: 'publishUnpublishedEntry',
        then: defaultParams
          .keys({
            collection,
            slug,
          })
          .required(),
      },
      {
        is: 'getMedia',
        then: defaultParams
          .keys({
            mediaFolder: path,
          })
          .required(),
      },
      {
        is: 'getMediaFile',
        then: defaultParams
          .keys({
            path,
          })
          .required(),
      },
      {
        is: 'persistMedia',
        then: defaultParams
          .keys({
            asset: asset.required(),
            options: Joi.object({
              commitMessage: requiredString,
            }).required(),
          })
          .required(),
      },
      {
        is: 'deleteFile',
        then: defaultParams
          .keys({
            path,
            options: Joi.object({
              commitMessage: requiredString,
            }).required(),
          })
          .required(),
      },
      {
        is: 'getDeployPreview',
        then: defaultParams
          .keys({
            collection,
            slug,
          })
          .required(),
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
