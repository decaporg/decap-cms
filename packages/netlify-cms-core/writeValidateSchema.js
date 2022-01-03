'use strict';

const fs = require("fs")
const path = require("path")
const AJV = require('ajv');
const ajvErrors = require('ajv-errors');
const ajv = new AJV({
  allErrors: true,
  $data: true,
  code: { source: true },
  strict: false
});
const {
  select,
  uniqueItemProperties,
  prohibited,
} = require('ajv-keywords/dist/keywords');
const standaloneCode = require("ajv/dist/standalone").default

const schema = require('./config.schema.json');

uniqueItemProperties(ajv);
select(ajv);
prohibited(ajv);
ajvErrors(ajv);

// 1. generate module with a single default export (CommonJS and ESM compatible):
const validate = ajv.compile(schema)
let moduleCode = standaloneCode(ajv, validate)

// 2. pass map of schema IDs to generate multiple exports,
// it avoids code duplication if schemas are mutually recursive or have some share elements:
moduleCode = standaloneCode(ajv, {
  validateObject: "https://netlify-cms/object.json",
})

// 3. or generate module with all schemas added to the instance (excluding meta-schemas),
// export names would use schema IDs (or keys passed to addSchema method):
moduleCode = standaloneCode(ajv);

console.dir({moduleCode})

fs.writeFileSync(path.join(__dirname, "./src/constants/validateSchema.js"), moduleCode)