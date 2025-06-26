const { _ } = require('ajv');

module.exports = function addInstanceOfKeyword(ajv) {
  ajv.addKeyword({
    keyword: 'instanceof',
    schemaType: 'string',
    type: ['string', 'number', 'array', 'object'],
    code(cxt) {
      const { data, schema } = cxt;
      cxt.fail(_`!(${data} instanceof ` + schema + `)`);
    },
  });
};
