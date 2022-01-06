const { _ } = require('ajv');

module.exports = function addInstanceOfKeyword(ajv) {
  ajv.addKeyword({
    keyword: 'instanceof',
    schemaType: 'string',
    type: ['string', 'number', 'array', 'object'],
    // compile(schema) {
    //   return data =>
    //     data instanceof
    //     ({
    //       Object,
    //       Array,
    //       Function,
    //       Number,
    //       String,
    //       Date,
    //       RegExp,
    //     })[schema];
    // },
    code(cxt) {
      const { data, schema } = cxt;
      cxt.fail(_`!(${data} instanceof ` + schema + `)`);
    }
  });
};
