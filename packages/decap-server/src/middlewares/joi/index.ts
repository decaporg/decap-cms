import Joi from '@hapi/joi';

import type express from 'express';

const allowedActions = [
  'info',
  'entriesByFolder',
  'entriesByFiles',
  'getEntry',
  'unpublishedEntries',
  'unpublishedEntry',
  'unpublishedEntryDataFile',
  'unpublishedEntryMediaFile',
  'deleteUnpublishedEntry',
  'persistEntry',
  'updateUnpublishedEntryStatus',
  'publishUnpublishedEntry',
  'getMedia',
  'getMediaFile',
  'persistMedia',
  'deleteFile',
  'deleteFiles',
  'getDeployPreview',
];

const requiredString = Joi.string().required();
const requiredNumber = Joi.number().required();
const requiredBool = Joi.bool().required();

const collection = requiredString;
const slug = requiredString;

export function defaultSchema({ path = requiredString } = {}) {
  const defaultParams = Joi.object({
    branch: requiredString,
  });

  const asset = Joi.object({
    path,
    content: requiredString,
    encoding: requiredString.valid('base64'),
  });

  const dataFile = Joi.object({
    slug: requiredString,
    path,
    raw: requiredString,
    newPath: path.optional(),
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
            .items(Joi.object({ path, label: Joi.string() }))
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
            id: Joi.string().optional(),
            collection: Joi.string().optional(),
            slug: Joi.string().optional(),
            cmsLabelPrefix: Joi.string().optional(),
          })
          .required(),
      },
      {
        is: 'unpublishedEntryDataFile',
        then: defaultParams
          .keys({
            collection,
            slug,
            id: requiredString,
            path: requiredString,
          })
          .required(),
      },
      {
        is: 'unpublishedEntryMediaFile',
        then: defaultParams
          .keys({
            collection,
            slug,
            id: requiredString,
            path: requiredString,
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
            cmsLabelPrefix: Joi.string().optional(),
            entry: dataFile, // entry is kept for backwards compatibility
            dataFiles: Joi.array().items(dataFile),
            assets: Joi.array().items(asset).required(),
            options: Joi.object({
              collectionName: Joi.string(),
              commitMessage: requiredString,
              useWorkflow: requiredBool,
              status: requiredString,
            }).required(),
          })
          .xor('entry', 'dataFiles')
          .required(),
      },
      {
        is: 'updateUnpublishedEntryStatus',
        then: defaultParams
          .keys({
            collection,
            slug,
            newStatus: requiredString,
            cmsLabelPrefix: Joi.string().optional(),
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
        is: 'deleteFiles',
        then: defaultParams
          .keys({
            paths: Joi.array().items(path).min(1).required(),
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
}

export function joi(schema: Joi.Schema) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { error } = schema.validate(req.body, { allowUnknown: true });
    if (error) {
      const { details } = error;
      const message = details.map(i => i.message).join(',');
      res.status(422).json({ error: message });
    } else {
      next();
    }
  };
}
