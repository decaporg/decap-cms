const { _ } = require('ajv');

module.exports = function uniqueItemPropertiesKeyword(ajv) {
  ajv.addKeyword({
    keyword: 'uniqueItemProperties',
    type: 'array',
    schemaType: 'array',
    code(cxt) {
      const { data, schemaValue } = cxt;
      // generates code that checks if any property in the value repeats itself
      cxt.fail(_`${schemaValue}
        .map(
            property => ${data}
                .map(item => item && item[property])
                .some((value, index, array) => array.indexOf(value) !== index)
            )
        .some((value) => value)`);
    },
  });
};
