/**
 * This file is to be used by node. There is no file system access at the client.
 * To be called from our webpack devServer.setup config
 * See: http://expressjs.com/en/guide/using-middleware.html
 * const fsExpressAPI = require('./scripts/fs/fs-express-api');
 * devServer: {
 * .
 * .
 * setup: fsExpressAPI,
 * },
**/
const bodyParser = require('body-parser');
const multer = require('multer');
const fsAPI = require('./fs-api');

/* Express allows for app object setup to handle paths (our api routes) */
module.exports = function(app) {
  const upload = multer(); // for parsing multipart/form-data
  const uploadLimit = '50mb'; // express has a default of ~20Kb
  app.use(bodyParser.json({ limit: uploadLimit })); // for parsing application/json
  app.use(bodyParser.urlencoded({ limit: uploadLimit, extended: true, parameterLimit:50000 })); // for parsing application/x-www-form-urlencoded

  // We will look at every route to bypass any /api route from the react app
  app.use('/:path', function(req, res, next) {
    // if the path is api, skip to the next route
    if (req.params.path === 'api') {
      next('route');
    }
    // otherwise pass the control out of this middleware to the next middleware function in this stack (back to regular)
    else next();
  });

  app.use('/api', function(req, res, next) {
    const response = { route: '/api', url: req.originalUrl };
    if (req.originalUrl === "/api" || req.originalUrl === "/api/") {
      // if the requested url is the root, , respond Error!
      response.status = 500;
      response.error = 'This is the root of the API';
      res.status(response.status).json(response);
    } else {
      // continue to the next sub-route ('/api/:path')
      next('route');
    }
  });

  /* Define custom handlers for api paths: */
  app.use('/api/:path', function(req, res, next) {
    const response = { route: '/api/:path', path: req.params.path, params: req.params };
    if (req.params.path && req.params.path in fsAPI) {
      // all good, route exists in the api
      next('route');
    } else {
      // sub-route was not found in the api, respond Error!
      response.status = 500;
      response.error = `Invalid path ${ req.params.path }`;
      res.status(response.status).json(response);
    }
  });

  /* Files */

  /* Return all the files in the starting path */
  app.get('/api/files', function(req, res, next) {
    const response = { route: '/api/files' };
    try {
      fsAPI.files('./').read((contents) => {
        res.json(contents);
      });
    } catch (err) {
      response.status = 500;
      response.error = `Could not get files - code [${ err.code }]`;
      response.internalError = err;
      res.status(response.status).send(response);
    }
  });

  /* Return all the files in the passed path */
  app.get('/api/files/:path', function(req, res, next) {
    const response = { route: '/api/files/:path', params: req.params, path: req.params.path };
    try {
      fsAPI.files(req.params.path).read((contents) => {
        res.json(contents);
      });
    } catch (err) {
      response.status = 500;
      response.error = `Could not get files for ${ req.params.path } - code [${ err.code }]`;
      response.internalError = err;
      res.status(response.status).send(response);
    }
  });
  /* Capture Unknown extras and handle path (ignore?) */
  app.get('/api/files/:path/**', function(req, res, next) {
    const response = { route: '/api/files/:path/**', params: req.params, path: req.params.path };
    const filesPath = req.originalUrl.substring(11, req.originalUrl.split('?', 1)[0].length);
    try {
      fsAPI.files(filesPath).read((contents) => {
        res.json(contents);
      });
    } catch (err) {
      response.status = 500;
      response.error = `Could not get files for ${ filesPath } - code [${ err.code }]`;
      response.internalError = err;
      res.status(response.status).send(response);
    }
  });

  /* File */

  app.get('/api/file', function(req, res, next) {
    const response = { error: 'Id cannot be empty for file', status: 500, path: res.path };
    res.status(response.status).send(response);
  });

  app.get('/api/file/:id', function(req, res, next) {
    const response = { route: '/api/file/:id', id: req.params.id };
    const allDone = (contents) => {
      if (contents.error) {
        response.status = 500;
        response.error = `Could not read file ${ req.params.id } - code [${ contents.error.code }]`;
        response.internalError = contents.error;
        res.status(response.status).send(response);
      } else {
        res.json(contents);
      }
    };
    if (req.params.id) {
      fsAPI.file(req.params.id).read(allDone);
    } else {
      response.status = 500;
      response.error = `Invalid id for File ${ req.params.id }`;
      res.status(response.status).send(response);
    }
  });
  /* Capture Unknown extras and ignore the rest */
  app.get('/api/file/:id/**', function(req, res, next) {
    const response = { route: '/api/file/:id', id: req.params.id, method:req.method };
    const filePath = req.originalUrl.substring(10, req.originalUrl.split('?', 1)[0].length);
    const allDone = (contents) => {
      if (contents.error) {
        response.status = 500;
        response.error = `Could not read file ${ filePath } - code [${ contents.error.code }]`;
        response.internalError = contents.error;
        res.status(response.status).send(response);
      } else {
        res.json(contents);
      }
    };
    if (filePath) {
      fsAPI.file(filePath).read(allDone);
    } else {
      response.status = 500;
      response.error = `Invalid path for File ${ filePath }`;
      res.status(response.status).send(response);
    }
  });
  /* Create file if path does not exist */
  app.post('/api/file/:id/**', upload.array(), function(req, res, next) {
    const response = { route: '/api/file/:id', id: req.params.id, method:req.method };
    const filePath = req.originalUrl.substring(10, req.originalUrl.split('?', 1)[0].length);
    const allDone = (contents) => {
      if (contents.error) {
        response.status = 500;
        response.error = `Could not create file ${ filePath } - code [${ contents.error.code }]`;
        response.internalError = contents.error;
        res.status(response.status).send(response);
      } else {
        res.json(contents);
      }
    };
    if (filePath) {
      fsAPI.file(filePath).create(req.body, allDone);
    } else {
      response.status = 500;
      response.error = `Invalid path for File ${ filePath }`;
      res.status(response.status).send(response);
    }
  });
  /* Update file, error on path exists */
  app.put('/api/file/:id/**', upload.array(), function(req, res, next) {
    const response = { route: '/api/file/:id', id: req.params.id, method:req.method };
    const filePath = req.originalUrl.substring(10, req.originalUrl.split('?', 1)[0].length);
    const allDone = (contents) => {
      if (contents.error) {
        response.status = 500;
        response.error = `Could not update file ${ filePath } - code [${ contents.error.code }]`;
        response.internalError = contents.error;
        res.status(response.status).send(response);
      } else {
        res.json(contents);
      }
    };
    if (filePath) {
      fsAPI.file(filePath).update(req.body, allDone);
    } else {
      response.status = 500;
      response.error = `Invalid path for File ${ filePath }`;
      res.status(response.status).send(response);
    }
  });
  /* Delete file, error if no file */
  app.delete('/api/file/:id/**', function(req, res, next) {
    const response = { route: '/api/file/:id', id: req.params.id, method:req.method };
    const filePath = req.originalUrl.substring(10, req.originalUrl.split('?', 1)[0].length);
    const allDone = (contents) => {
      if (contents.error) {
        response.status = 500;
        response.error = `Could not delete file ${ filePath } - code [${ contents.error.code }]`;
        response.internalError = contents.error;
        res.status(response.status).send(response);
      } else {
        res.json(contents);
      }
    };
    if (filePath) {
      fsAPI.file(filePath).del(allDone);
    } else {
      response.status = 500;
      response.error = `Invalid path for File ${ filePath }`;
      res.status(response.status).send(response);
    }
  });
};
