'use strict';
var RULES = require('ajv/lib/compile/rules')();
var ucs2length = require('ajv/lib/compile/ucs2length');
var equal = require('ajv/lib/compile/equal');
var validate = (function() {
  var pattern0 = new RegExp('^[a-zA-Z-_]+$');
  var refVal = [];
  var refVal1 = (function() {
    var pattern0 = new RegExp('^[a-zA-Z-_]+$');
    return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
      'use strict'; /*# sourceURL=field_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d */
      var vErrors = null;
      var errors = 0;
      if (rootData === undefined) rootData = data;
      if ((data && typeof data === "object" && !Array.isArray(data))) {
        var errs__0 = errors;
        var valid1 = true;
        if (data.name === undefined) {
          valid1 = false;
          var err = {
            keyword: 'required',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/required',
            params: {
              missingProperty: 'name'
            },
            message: 'should have required property \'name\''
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        } else {
          var errs_1 = errors;
          if (typeof data.name !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/name',
              schemaPath: '#/properties/name/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        if (data.label !== undefined) {
          var errs_1 = errors;
          if (typeof data.label !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/label',
              schemaPath: '#/properties/label/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        if (data.widget !== undefined) {
          var errs_1 = errors;
          if (typeof data.widget !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/widget',
              schemaPath: '#/properties/widget/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        if (data.required !== undefined) {
          var errs_1 = errors;
          if (typeof data.required !== "boolean") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/required',
              schemaPath: '#/properties/required/type',
              params: {
                type: 'boolean'
              },
              message: 'should be boolean'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        var data1 = data.i18n;
        if (data1 !== undefined) {
          var errs_1 = errors;
          var errs__1 = errors,
            prevValid1 = false,
            valid1 = false,
            passingSchemas1 = null;
          var errs_2 = errors;
          if (typeof data1 !== "boolean") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/oneOf/0/type',
              params: {
                type: 'boolean'
              },
              message: 'should be boolean'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid2 = errors === errs_2;
          if (valid2) {
            valid1 = prevValid1 = true;
            passingSchemas1 = 0;
          }
          var errs_2 = errors;
          if (typeof data1 !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/oneOf/1/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var schema2 = validate.schema.properties.i18n.oneOf[1].enum;
          var valid2;
          valid2 = false;
          for (var i2 = 0; i2 < schema2.length; i2++)
            if (equal(data1, schema2[i2])) {
              valid2 = true;
              break;
            } if (!valid2) {
            var err = {
              keyword: 'enum',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/oneOf/1/enum',
              params: {
                allowedValues: schema2
              },
              message: 'should be equal to one of the allowed values'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid2 = errors === errs_2;
          if (valid2 && prevValid1) {
            valid1 = false;
            passingSchemas1 = [passingSchemas1, 1];
          } else {
            if (valid2) {
              valid1 = prevValid1 = true;
              passingSchemas1 = 1;
            }
          }
          if (!valid1) {
            var err = {
              keyword: 'oneOf',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/oneOf',
              params: {
                passingSchemas: passingSchemas1
              },
              message: 'should match exactly one schema in oneOf'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          } else {
            errors = errs__1;
            if (vErrors !== null) {
              if (errs__1) vErrors.length = errs__1;
              else vErrors = null;
            }
          }
          var valid1 = errors === errs_1;
        }
        if (data.hint !== undefined) {
          var errs_1 = errors;
          if (typeof data.hint !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/hint',
              schemaPath: '#/properties/hint/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        var data1 = data.pattern;
        if (data1 !== undefined) {
          var errs_1 = errors;
          if (Array.isArray(data1)) {
            if (data1.length < 2) {
              var err = {
                keyword: 'minItems',
                dataPath: (dataPath || '') + '/pattern',
                schemaPath: '#/properties/pattern/minItems',
                params: {
                  limit: 2
                },
                message: 'should NOT have fewer than 2 items'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var errs__1 = errors;
            var valid1;
            valid2 = true;
            if (data1.length > 0) {
              var data2 = data1[0];
              var errs_2 = errors;
              var errs__2 = errors,
                prevValid2 = false,
                valid2 = false,
                passingSchemas2 = null;
              var errs_3 = errors;
              if (typeof data2 !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/pattern/' + 0,
                  schemaPath: '#/properties/pattern/items/0/oneOf/0/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid3 = errors === errs_3;
              if (valid3) {
                valid2 = prevValid2 = true;
                passingSchemas2 = 0;
              }
              var errs_3 = errors;
              customRule1.errors = null;
              var errs__3 = errors;
              var valid3;
              customRule1.errors = null;
              valid3 = customRule1.call(self, data2, (dataPath || '') + '/pattern/' + 0, data1, 0, rootData);
              if (!valid3) {
                if (Array.isArray(customRule1.errors)) {
                  if (vErrors === null) vErrors = customRule1.errors;
                  else vErrors = vErrors.concat(customRule1.errors);
                  errors = vErrors.length;
                  for (var i3 = errs__3; i3 < errors; i3++) {
                    var ruleErr3 = vErrors[i3];
                    if (ruleErr3.dataPath === undefined) ruleErr3.dataPath = (dataPath || '') + '/pattern/' + 0;
                    ruleErr3.schemaPath = "#/properties/pattern/items/0/oneOf/1/instanceof";
                  }
                } else {
                  var err = {
                    keyword: 'instanceof',
                    dataPath: (dataPath || '') + '/pattern/' + 0,
                    schemaPath: '#/properties/pattern/items/0/oneOf/1/instanceof',
                    params: {
                      keyword: 'instanceof'
                    },
                    message: 'should pass "instanceof" keyword validation'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
              }
              var valid3 = errors === errs_3;
              if (valid3 && prevValid2) {
                valid2 = false;
                passingSchemas2 = [passingSchemas2, 1];
              } else {
                if (valid3) {
                  valid2 = prevValid2 = true;
                  passingSchemas2 = 1;
                }
              }
              if (!valid2) {
                var err = {
                  keyword: 'oneOf',
                  dataPath: (dataPath || '') + '/pattern/' + 0,
                  schemaPath: '#/properties/pattern/items/0/oneOf',
                  params: {
                    passingSchemas: passingSchemas2
                  },
                  message: 'should match exactly one schema in oneOf'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              } else {
                errors = errs__2;
                if (vErrors !== null) {
                  if (errs__2) vErrors.length = errs__2;
                  else vErrors = null;
                }
              }
              var valid2 = errors === errs_2;
            }
            valid2 = true;
            if (data1.length > 1) {
              var errs_2 = errors;
              if (typeof data1[1] !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/pattern/' + 1,
                  schemaPath: '#/properties/pattern/items/1/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
          } else {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/pattern',
              schemaPath: '#/properties/pattern/type',
              params: {
                type: 'array'
              },
              message: 'should be array'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        if (data.field !== undefined) {
          var errs_1 = errors;
          if (!refVal[1](data.field, (dataPath || '') + '/field', data, 'field', rootData)) {
            if (vErrors === null) vErrors = refVal[1].errors;
            else vErrors = vErrors.concat(refVal[1].errors);
            errors = vErrors.length;
          }
          var valid1 = errors === errs_1;
        }
        if (data.fields !== undefined) {
          var errs_1 = errors;
          if (!refVal2(data.fields, (dataPath || '') + '/fields', data, 'fields', rootData)) {
            if (vErrors === null) vErrors = refVal2.errors;
            else vErrors = vErrors.concat(refVal2.errors);
            errors = vErrors.length;
          }
          var valid1 = errors === errs_1;
        }
        if (data.types !== undefined) {
          var errs_1 = errors;
          if (!refVal[2](data.types, (dataPath || '') + '/types', data, 'types', rootData)) {
            if (vErrors === null) vErrors = refVal[2].errors;
            else vErrors = vErrors.concat(refVal[2].errors);
            errors = vErrors.length;
          }
          var valid1 = errors === errs_1;
        }
      } else {
        var err = {
          keyword: 'type',
          dataPath: (dataPath || '') + "",
          schemaPath: '#/type',
          params: {
            type: 'object'
          },
          message: 'should be object'
        };
        if (vErrors === null) vErrors = [err];
        else vErrors.push(err);
        errors++;
      }
      var schema0 = data && data.widget;
      var definition0 = RULES.custom['select'].definition;
      var keywordValidate0 = definition0.validate;
      keywordValidate0.errors = null;
      var errs__0 = errors;
      var valid0;
      if (schema0 === undefined) {
        valid0 = true;
      } else {
        valid0 = definition0.validateSchema(schema0);
        if (valid0) {
          keywordValidate0.errors = null;
          valid0 = keywordValidate0.call(self, schema0, data, validate.schema, (dataPath || ''), parentData, parentDataProperty, rootData);
        }
      }
      if (!valid0) {
        if (Array.isArray(keywordValidate0.errors)) {
          if (vErrors === null) vErrors = keywordValidate0.errors;
          else vErrors = vErrors.concat(keywordValidate0.errors);
          errors = vErrors.length;
          for (var i0 = errs__0; i0 < errors; i0++) {
            var ruleErr0 = vErrors[i0];
            if (ruleErr0.dataPath === undefined) ruleErr0.dataPath = (dataPath || '') + "";
            ruleErr0.schemaPath = "#/select";
          }
        } else {
          var err = {
            keyword: 'select',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/select',
            params: {
              keyword: 'select'
            },
            message: 'should pass "select" keyword validation'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
      }
      customRule5.errors = null;
      var errs__0 = errors;
      var valid0;
      customRule5.errors = null;
      valid0 = customRule5.call(self, data, (dataPath || ''), parentData, parentDataProperty, rootData);
      validate.errors = vErrors;
      return errors === 0;
    };
  })();
  refVal1.schema = {
    "$id": "field_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d",
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "widget": {
        "type": "string"
      },
      "required": {
        "type": "boolean"
      },
      "i18n": {
        "oneOf": [{
          "type": "boolean"
        }, {
          "type": "string",
          "enum": ["translate", "duplicate", "none"]
        }]
      },
      "hint": {
        "type": "string"
      },
      "pattern": {
        "type": "array",
        "minItems": 2,
        "items": [{
          "oneOf": [{
            "type": "string"
          }, {
            "instanceof": "RegExp"
          }]
        }, {
          "type": "string"
        }]
      },
      "field": {
        "$ref": "field_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d"
      },
      "fields": {
        "$ref": "fields_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d"
      },
      "types": {
        "$ref": "fields_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d"
      }
    },
    "select": {
      "$data": "0/widget"
    },
    "selectCases": {
      "unknown": {},
      "string": {},
      "number": {
        "properties": {
          "step": {
            "type": "number"
          },
          "value_type": {
            "type": "string"
          },
          "min": {
            "type": "number"
          },
          "max": {
            "type": "number"
          }
        }
      },
      "text": {},
      "image": {
        "properties": {
          "allow_multiple": {
            "type": "boolean"
          }
        }
      },
      "file": {
        "properties": {
          "allow_multiple": {
            "type": "boolean"
          }
        }
      },
      "select": {
        "properties": {
          "multiple": {
            "type": "boolean"
          },
          "min": {
            "type": "integer"
          },
          "max": {
            "type": "integer"
          },
          "options": {
            "type": "array",
            "items": {
              "oneOf": [{
                "type": "string"
              }, {
                "type": "number"
              }, {
                "type": "object",
                "properties": {
                  "label": {
                    "type": "string"
                  },
                  "value": {
                    "oneOf": [{
                      "type": "string"
                    }, {
                      "type": "number"
                    }]
                  }
                },
                "required": ["label", "value"]
              }]
            }
          }
        },
        "required": ["options"]
      },
      "markdown": {
        "properties": {
          "minimal": {
            "type": "boolean"
          },
          "buttons": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["bold", "italic", "code", "link", "heading-one", "heading-two", "heading-three", "heading-four", "heading-five", "heading-six", "quote", "bulleted-list", "numbered-list"]
            }
          },
          "editor_components": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "modes": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["raw", "rich_text"]
            },
            "minItems": 1
          }
        }
      },
      "list": {
        "properties": {
          "allow_add": {
            "type": "boolean"
          },
          "collapsed": {
            "type": "boolean"
          },
          "summary": {
            "type": "string"
          },
          "minimize_collapsed": {
            "type": "boolean"
          },
          "label_singular": {
            "type": "string"
          },
          "i18n": {
            "type": "boolean"
          },
          "min": {
            "type": "number"
          },
          "max": {
            "type": "number"
          }
        }
      },
      "object": {
        "properties": {
          "collapsed": {
            "type": "boolean"
          },
          "i18n": {
            "type": "boolean"
          }
        }
      },
      "relation": {
        "properties": {
          "collection": {
            "type": "string"
          },
          "value_field": {
            "type": "string"
          },
          "search_fields": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "string"
            }
          },
          "file": {
            "type": "string"
          },
          "multiple": {
            "type": "boolean"
          },
          "min": {
            "type": "integer"
          },
          "max": {
            "type": "integer"
          },
          "display_fields": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "string"
            }
          },
          "options_length": {
            "type": "integer"
          }
        },
        "oneOf": [{
          "required": ["collection", "value_field", "search_fields"]
        }, {
          "required": ["collection", "valueField", "searchFields"]
        }]
      },
      "boolean": {},
      "map": {
        "properties": {
          "decimals": {
            "type": "integer"
          },
          "type": {
            "type": "string",
            "enum": ["Point", "LineString", "Polygon"]
          }
        }
      },
      "date": {},
      "datetime": {
        "properties": {
          "format": {
            "type": "string"
          },
          "date_format": {
            "oneOf": [{
              "type": "string"
            }, {
              "type": "boolean"
            }]
          },
          "time_format": {
            "oneOf": [{
              "type": "string"
            }, {
              "type": "boolean"
            }]
          },
          "picker_utc": {
            "type": "boolean"
          }
        }
      },
      "code": {
        "properties": {
          "default_language": {
            "type": "string"
          },
          "allow_language_selection": {
            "type": "boolean"
          },
          "output_code_only": {
            "type": "boolean"
          },
          "keys": {
            "type": "object",
            "properties": {
              "code": {
                "type": "string"
              },
              "lang": {
                "type": "string"
              }
            }
          }
        }
      },
      "color": {}
    },
    "required": ["name"]
  };
  refVal1.errors = null;
  refVal[1] = refVal1;
  var refVal2 = (function() {
    var pattern0 = new RegExp('^[a-zA-Z-_]+$');
    return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
      'use strict'; /*# sourceURL=fields_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d */
      var vErrors = null;
      var errors = 0;
      if (rootData === undefined) rootData = data;
      if (Array.isArray(data)) {
        if (data.length < 1) {
          var err = {
            keyword: 'minItems',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/minItems',
            params: {
              limit: 1
            },
            message: 'should NOT have fewer than 1 items'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var errs__0 = errors;
        var valid0;
        for (var i0 = 0; i0 < data.length; i0++) {
          var data1 = data[i0];
          var errs_1 = errors;
          if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
            var errs__1 = errors;
            var valid2 = true;
            if (data1.name === undefined) {
              valid2 = false;
              var err = {
                keyword: 'required',
                dataPath: (dataPath || '') + '/' + i0,
                schemaPath: '#/items/required',
                params: {
                  missingProperty: 'name'
                },
                message: 'should have required property \'name\''
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            } else {
              var errs_2 = errors;
              if (typeof data1.name !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/name',
                  schemaPath: '#/items/properties/name/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.label !== undefined) {
              var errs_2 = errors;
              if (typeof data1.label !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/label',
                  schemaPath: '#/items/properties/label/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.widget !== undefined) {
              var errs_2 = errors;
              if (typeof data1.widget !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/widget',
                  schemaPath: '#/items/properties/widget/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.required !== undefined) {
              var errs_2 = errors;
              if (typeof data1.required !== "boolean") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/required',
                  schemaPath: '#/items/properties/required/type',
                  params: {
                    type: 'boolean'
                  },
                  message: 'should be boolean'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            var data2 = data1.i18n;
            if (data2 !== undefined) {
              var errs_2 = errors;
              var errs__2 = errors,
                prevValid2 = false,
                valid2 = false,
                passingSchemas2 = null;
              var errs_3 = errors;
              if (typeof data2 !== "boolean") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/i18n',
                  schemaPath: '#/items/properties/i18n/oneOf/0/type',
                  params: {
                    type: 'boolean'
                  },
                  message: 'should be boolean'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid3 = errors === errs_3;
              if (valid3) {
                valid2 = prevValid2 = true;
                passingSchemas2 = 0;
              }
              var errs_3 = errors;
              if (typeof data2 !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/i18n',
                  schemaPath: '#/items/properties/i18n/oneOf/1/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var schema3 = validate.schema.items.properties.i18n.oneOf[1].enum;
              var valid3;
              valid3 = false;
              for (var i3 = 0; i3 < schema3.length; i3++)
                if (equal(data2, schema3[i3])) {
                  valid3 = true;
                  break;
                } if (!valid3) {
                var err = {
                  keyword: 'enum',
                  dataPath: (dataPath || '') + '/' + i0 + '/i18n',
                  schemaPath: '#/items/properties/i18n/oneOf/1/enum',
                  params: {
                    allowedValues: schema3
                  },
                  message: 'should be equal to one of the allowed values'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid3 = errors === errs_3;
              if (valid3 && prevValid2) {
                valid2 = false;
                passingSchemas2 = [passingSchemas2, 1];
              } else {
                if (valid3) {
                  valid2 = prevValid2 = true;
                  passingSchemas2 = 1;
                }
              }
              if (!valid2) {
                var err = {
                  keyword: 'oneOf',
                  dataPath: (dataPath || '') + '/' + i0 + '/i18n',
                  schemaPath: '#/items/properties/i18n/oneOf',
                  params: {
                    passingSchemas: passingSchemas2
                  },
                  message: 'should match exactly one schema in oneOf'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              } else {
                errors = errs__2;
                if (vErrors !== null) {
                  if (errs__2) vErrors.length = errs__2;
                  else vErrors = null;
                }
              }
              var valid2 = errors === errs_2;
            }
            if (data1.hint !== undefined) {
              var errs_2 = errors;
              if (typeof data1.hint !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/hint',
                  schemaPath: '#/items/properties/hint/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            var data2 = data1.pattern;
            if (data2 !== undefined) {
              var errs_2 = errors;
              if (Array.isArray(data2)) {
                if (data2.length < 2) {
                  var err = {
                    keyword: 'minItems',
                    dataPath: (dataPath || '') + '/' + i0 + '/pattern',
                    schemaPath: '#/items/properties/pattern/minItems',
                    params: {
                      limit: 2
                    },
                    message: 'should NOT have fewer than 2 items'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var errs__2 = errors;
                var valid2;
                valid3 = true;
                if (data2.length > 0) {
                  var data3 = data2[0];
                  var errs_3 = errors;
                  var errs__3 = errors,
                    prevValid3 = false,
                    valid3 = false,
                    passingSchemas3 = null;
                  var errs_4 = errors;
                  if (typeof data3 !== "string") {
                    var err = {
                      keyword: 'type',
                      dataPath: (dataPath || '') + '/' + i0 + '/pattern/' + 0,
                      schemaPath: '#/items/properties/pattern/items/0/oneOf/0/type',
                      params: {
                        type: 'string'
                      },
                      message: 'should be string'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var valid4 = errors === errs_4;
                  if (valid4) {
                    valid3 = prevValid3 = true;
                    passingSchemas3 = 0;
                  }
                  var errs_4 = errors;
                  customRule2.errors = null;
                  var errs__4 = errors;
                  var valid4;
                  customRule2.errors = null;
                  valid4 = customRule2.call(self, data3, (dataPath || '') + '/' + i0 + '/pattern/' + 0, data2, 0, rootData);
                  if (!valid4) {
                    if (Array.isArray(customRule2.errors)) {
                      if (vErrors === null) vErrors = customRule2.errors;
                      else vErrors = vErrors.concat(customRule2.errors);
                      errors = vErrors.length;
                      for (var i4 = errs__4; i4 < errors; i4++) {
                        var ruleErr4 = vErrors[i4];
                        if (ruleErr4.dataPath === undefined) ruleErr4.dataPath = (dataPath || '') + '/' + i0 + '/pattern/' + 0;
                        ruleErr4.schemaPath = "#/items/properties/pattern/items/0/oneOf/1/instanceof";
                      }
                    } else {
                      var err = {
                        keyword: 'instanceof',
                        dataPath: (dataPath || '') + '/' + i0 + '/pattern/' + 0,
                        schemaPath: '#/items/properties/pattern/items/0/oneOf/1/instanceof',
                        params: {
                          keyword: 'instanceof'
                        },
                        message: 'should pass "instanceof" keyword validation'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                  }
                  var valid4 = errors === errs_4;
                  if (valid4 && prevValid3) {
                    valid3 = false;
                    passingSchemas3 = [passingSchemas3, 1];
                  } else {
                    if (valid4) {
                      valid3 = prevValid3 = true;
                      passingSchemas3 = 1;
                    }
                  }
                  if (!valid3) {
                    var err = {
                      keyword: 'oneOf',
                      dataPath: (dataPath || '') + '/' + i0 + '/pattern/' + 0,
                      schemaPath: '#/items/properties/pattern/items/0/oneOf',
                      params: {
                        passingSchemas: passingSchemas3
                      },
                      message: 'should match exactly one schema in oneOf'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  } else {
                    errors = errs__3;
                    if (vErrors !== null) {
                      if (errs__3) vErrors.length = errs__3;
                      else vErrors = null;
                    }
                  }
                  var valid3 = errors === errs_3;
                }
                valid3 = true;
                if (data2.length > 1) {
                  var errs_3 = errors;
                  if (typeof data2[1] !== "string") {
                    var err = {
                      keyword: 'type',
                      dataPath: (dataPath || '') + '/' + i0 + '/pattern/' + 1,
                      schemaPath: '#/items/properties/pattern/items/1/type',
                      params: {
                        type: 'string'
                      },
                      message: 'should be string'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var valid3 = errors === errs_3;
                }
              } else {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/pattern',
                  schemaPath: '#/items/properties/pattern/type',
                  params: {
                    type: 'array'
                  },
                  message: 'should be array'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.field !== undefined) {
              var errs_2 = errors;
              if (!refVal[1](data1.field, (dataPath || '') + '/' + i0 + '/field', data1, 'field', rootData)) {
                if (vErrors === null) vErrors = refVal[1].errors;
                else vErrors = vErrors.concat(refVal[1].errors);
                errors = vErrors.length;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.fields !== undefined) {
              var errs_2 = errors;
              if (!refVal[2](data1.fields, (dataPath || '') + '/' + i0 + '/fields', data1, 'fields', rootData)) {
                if (vErrors === null) vErrors = refVal[2].errors;
                else vErrors = vErrors.concat(refVal[2].errors);
                errors = vErrors.length;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.types !== undefined) {
              var errs_2 = errors;
              if (!refVal[2](data1.types, (dataPath || '') + '/' + i0 + '/types', data1, 'types', rootData)) {
                if (vErrors === null) vErrors = refVal[2].errors;
                else vErrors = vErrors.concat(refVal[2].errors);
                errors = vErrors.length;
              }
              var valid2 = errors === errs_2;
            }
          } else {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/' + i0,
              schemaPath: '#/items/type',
              params: {
                type: 'object'
              },
              message: 'should be object'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var schema1 = data1 && data1.widget;
          var definition1 = RULES.custom['select'].definition;
          var keywordValidate1 = definition1.validate;
          keywordValidate1.errors = null;
          var errs__1 = errors;
          var valid1;
          if (schema1 === undefined) {
            valid1 = true;
          } else {
            valid1 = definition1.validateSchema(schema1);
            if (valid1) {
              keywordValidate1.errors = null;
              valid1 = keywordValidate1.call(self, schema1, data1, validate.schema.items, (dataPath || '') + '/' + i0, data, i0, rootData);
            }
          }
          if (!valid1) {
            if (Array.isArray(keywordValidate1.errors)) {
              if (vErrors === null) vErrors = keywordValidate1.errors;
              else vErrors = vErrors.concat(keywordValidate1.errors);
              errors = vErrors.length;
              for (var i1 = errs__1; i1 < errors; i1++) {
                var ruleErr1 = vErrors[i1];
                if (ruleErr1.dataPath === undefined) ruleErr1.dataPath = (dataPath || '') + '/' + i0;
                ruleErr1.schemaPath = "#/items/select";
              }
            } else {
              var err = {
                keyword: 'select',
                dataPath: (dataPath || '') + '/' + i0,
                schemaPath: '#/items/select',
                params: {
                  keyword: 'select'
                },
                message: 'should pass "select" keyword validation'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
          }
          customRule3.errors = null;
          var errs__1 = errors;
          var valid1;
          customRule3.errors = null;
          valid1 = customRule3.call(self, data1, (dataPath || '') + '/' + i0, data, i0, rootData);
          var valid1 = errors === errs_1;
        }
        customRule4.errors = null;
        var errs__0 = errors;
        var valid0;
        customRule4.errors = null;
        valid0 = customRule4.call(self, data, (dataPath || ''), parentData, parentDataProperty, rootData);
        if (!valid0) {
          if (Array.isArray(customRule4.errors)) {
            if (vErrors === null) vErrors = customRule4.errors;
            else vErrors = vErrors.concat(customRule4.errors);
            errors = vErrors.length;
            for (var i0 = errs__0; i0 < errors; i0++) {
              var ruleErr0 = vErrors[i0];
              if (ruleErr0.dataPath === undefined) ruleErr0.dataPath = (dataPath || '') + "";
              ruleErr0.schemaPath = "#/uniqueItemProperties";
            }
          } else {
            var err = {
              keyword: 'uniqueItemProperties',
              dataPath: (dataPath || '') + "",
              schemaPath: '#/uniqueItemProperties',
              params: {
                keyword: 'uniqueItemProperties'
              },
              message: 'should pass "uniqueItemProperties" keyword validation'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
        }
      } else {
        var err = {
          keyword: 'type',
          dataPath: (dataPath || '') + "",
          schemaPath: '#/type',
          params: {
            type: 'array'
          },
          message: 'should be array'
        };
        if (vErrors === null) vErrors = [err];
        else vErrors.push(err);
        errors++;
      }
      validate.errors = vErrors;
      return errors === 0;
    };
  })();
  refVal2.schema = {
    "$id": "fields_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d",
    "type": "array",
    "minItems": 1,
    "items": {
      "$id": "field_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d",
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "widget": {
          "type": "string"
        },
        "required": {
          "type": "boolean"
        },
        "i18n": {
          "oneOf": [{
            "type": "boolean"
          }, {
            "type": "string",
            "enum": ["translate", "duplicate", "none"]
          }]
        },
        "hint": {
          "type": "string"
        },
        "pattern": {
          "type": "array",
          "minItems": 2,
          "items": [{
            "oneOf": [{
              "type": "string"
            }, {
              "instanceof": "RegExp"
            }]
          }, {
            "type": "string"
          }]
        },
        "field": {
          "$ref": "field_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d"
        },
        "fields": {
          "$ref": "fields_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d"
        },
        "types": {
          "$ref": "fields_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d"
        }
      },
      "select": {
        "$data": "0/widget"
      },
      "selectCases": {
        "unknown": {},
        "string": {},
        "number": {
          "properties": {
            "step": {
              "type": "number"
            },
            "value_type": {
              "type": "string"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            }
          }
        },
        "text": {},
        "image": {
          "properties": {
            "allow_multiple": {
              "type": "boolean"
            }
          }
        },
        "file": {
          "properties": {
            "allow_multiple": {
              "type": "boolean"
            }
          }
        },
        "select": {
          "properties": {
            "multiple": {
              "type": "boolean"
            },
            "min": {
              "type": "integer"
            },
            "max": {
              "type": "integer"
            },
            "options": {
              "type": "array",
              "items": {
                "oneOf": [{
                  "type": "string"
                }, {
                  "type": "number"
                }, {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "oneOf": [{
                        "type": "string"
                      }, {
                        "type": "number"
                      }]
                    }
                  },
                  "required": ["label", "value"]
                }]
              }
            }
          },
          "required": ["options"]
        },
        "markdown": {
          "properties": {
            "minimal": {
              "type": "boolean"
            },
            "buttons": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["bold", "italic", "code", "link", "heading-one", "heading-two", "heading-three", "heading-four", "heading-five", "heading-six", "quote", "bulleted-list", "numbered-list"]
              }
            },
            "editor_components": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "modes": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["raw", "rich_text"]
              },
              "minItems": 1
            }
          }
        },
        "list": {
          "properties": {
            "allow_add": {
              "type": "boolean"
            },
            "collapsed": {
              "type": "boolean"
            },
            "summary": {
              "type": "string"
            },
            "minimize_collapsed": {
              "type": "boolean"
            },
            "label_singular": {
              "type": "string"
            },
            "i18n": {
              "type": "boolean"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            }
          }
        },
        "object": {
          "properties": {
            "collapsed": {
              "type": "boolean"
            },
            "i18n": {
              "type": "boolean"
            }
          }
        },
        "relation": {
          "properties": {
            "collection": {
              "type": "string"
            },
            "value_field": {
              "type": "string"
            },
            "search_fields": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "string"
              }
            },
            "file": {
              "type": "string"
            },
            "multiple": {
              "type": "boolean"
            },
            "min": {
              "type": "integer"
            },
            "max": {
              "type": "integer"
            },
            "display_fields": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "string"
              }
            },
            "options_length": {
              "type": "integer"
            }
          },
          "oneOf": [{
            "required": ["collection", "value_field", "search_fields"]
          }, {
            "required": ["collection", "valueField", "searchFields"]
          }]
        },
        "boolean": {},
        "map": {
          "properties": {
            "decimals": {
              "type": "integer"
            },
            "type": {
              "type": "string",
              "enum": ["Point", "LineString", "Polygon"]
            }
          }
        },
        "date": {},
        "datetime": {
          "properties": {
            "format": {
              "type": "string"
            },
            "date_format": {
              "oneOf": [{
                "type": "string"
              }, {
                "type": "boolean"
              }]
            },
            "time_format": {
              "oneOf": [{
                "type": "string"
              }, {
                "type": "boolean"
              }]
            },
            "picker_utc": {
              "type": "boolean"
            }
          }
        },
        "code": {
          "properties": {
            "default_language": {
              "type": "string"
            },
            "allow_language_selection": {
              "type": "boolean"
            },
            "output_code_only": {
              "type": "boolean"
            },
            "keys": {
              "type": "object",
              "properties": {
                "code": {
                  "type": "string"
                },
                "lang": {
                  "type": "string"
                }
              }
            }
          }
        },
        "color": {}
      },
      "required": ["name"]
    },
    "uniqueItemProperties": ["name"]
  };
  refVal2.errors = null;
  refVal[2] = refVal2;
  var refVal3 = (function() {
    var pattern0 = new RegExp('^[a-zA-Z-_]+$');
    return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
      'use strict'; /*# sourceURL=field_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e */
      var vErrors = null;
      var errors = 0;
      if (rootData === undefined) rootData = data;
      if ((data && typeof data === "object" && !Array.isArray(data))) {
        var errs__0 = errors;
        var valid1 = true;
        if (data.name === undefined) {
          valid1 = false;
          var err = {
            keyword: 'required',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/required',
            params: {
              missingProperty: 'name'
            },
            message: 'should have required property \'name\''
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        } else {
          var errs_1 = errors;
          if (typeof data.name !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/name',
              schemaPath: '#/properties/name/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        if (data.label !== undefined) {
          var errs_1 = errors;
          if (typeof data.label !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/label',
              schemaPath: '#/properties/label/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        if (data.widget !== undefined) {
          var errs_1 = errors;
          if (typeof data.widget !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/widget',
              schemaPath: '#/properties/widget/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        if (data.required !== undefined) {
          var errs_1 = errors;
          if (typeof data.required !== "boolean") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/required',
              schemaPath: '#/properties/required/type',
              params: {
                type: 'boolean'
              },
              message: 'should be boolean'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        var data1 = data.i18n;
        if (data1 !== undefined) {
          var errs_1 = errors;
          var errs__1 = errors,
            prevValid1 = false,
            valid1 = false,
            passingSchemas1 = null;
          var errs_2 = errors;
          if (typeof data1 !== "boolean") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/oneOf/0/type',
              params: {
                type: 'boolean'
              },
              message: 'should be boolean'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid2 = errors === errs_2;
          if (valid2) {
            valid1 = prevValid1 = true;
            passingSchemas1 = 0;
          }
          var errs_2 = errors;
          if (typeof data1 !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/oneOf/1/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var schema2 = validate.schema.properties.i18n.oneOf[1].enum;
          var valid2;
          valid2 = false;
          for (var i2 = 0; i2 < schema2.length; i2++)
            if (equal(data1, schema2[i2])) {
              valid2 = true;
              break;
            } if (!valid2) {
            var err = {
              keyword: 'enum',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/oneOf/1/enum',
              params: {
                allowedValues: schema2
              },
              message: 'should be equal to one of the allowed values'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid2 = errors === errs_2;
          if (valid2 && prevValid1) {
            valid1 = false;
            passingSchemas1 = [passingSchemas1, 1];
          } else {
            if (valid2) {
              valid1 = prevValid1 = true;
              passingSchemas1 = 1;
            }
          }
          if (!valid1) {
            var err = {
              keyword: 'oneOf',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/oneOf',
              params: {
                passingSchemas: passingSchemas1
              },
              message: 'should match exactly one schema in oneOf'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          } else {
            errors = errs__1;
            if (vErrors !== null) {
              if (errs__1) vErrors.length = errs__1;
              else vErrors = null;
            }
          }
          var valid1 = errors === errs_1;
        }
        if (data.hint !== undefined) {
          var errs_1 = errors;
          if (typeof data.hint !== "string") {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/hint',
              schemaPath: '#/properties/hint/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        var data1 = data.pattern;
        if (data1 !== undefined) {
          var errs_1 = errors;
          if (Array.isArray(data1)) {
            if (data1.length < 2) {
              var err = {
                keyword: 'minItems',
                dataPath: (dataPath || '') + '/pattern',
                schemaPath: '#/properties/pattern/minItems',
                params: {
                  limit: 2
                },
                message: 'should NOT have fewer than 2 items'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var errs__1 = errors;
            var valid1;
            valid2 = true;
            if (data1.length > 0) {
              var data2 = data1[0];
              var errs_2 = errors;
              var errs__2 = errors,
                prevValid2 = false,
                valid2 = false,
                passingSchemas2 = null;
              var errs_3 = errors;
              if (typeof data2 !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/pattern/' + 0,
                  schemaPath: '#/properties/pattern/items/0/oneOf/0/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid3 = errors === errs_3;
              if (valid3) {
                valid2 = prevValid2 = true;
                passingSchemas2 = 0;
              }
              var errs_3 = errors;
              customRule10.errors = null;
              var errs__3 = errors;
              var valid3;
              customRule10.errors = null;
              valid3 = customRule10.call(self, data2, (dataPath || '') + '/pattern/' + 0, data1, 0, rootData);
              if (!valid3) {
                if (Array.isArray(customRule10.errors)) {
                  if (vErrors === null) vErrors = customRule10.errors;
                  else vErrors = vErrors.concat(customRule10.errors);
                  errors = vErrors.length;
                  for (var i3 = errs__3; i3 < errors; i3++) {
                    var ruleErr3 = vErrors[i3];
                    if (ruleErr3.dataPath === undefined) ruleErr3.dataPath = (dataPath || '') + '/pattern/' + 0;
                    ruleErr3.schemaPath = "#/properties/pattern/items/0/oneOf/1/instanceof";
                  }
                } else {
                  var err = {
                    keyword: 'instanceof',
                    dataPath: (dataPath || '') + '/pattern/' + 0,
                    schemaPath: '#/properties/pattern/items/0/oneOf/1/instanceof',
                    params: {
                      keyword: 'instanceof'
                    },
                    message: 'should pass "instanceof" keyword validation'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
              }
              var valid3 = errors === errs_3;
              if (valid3 && prevValid2) {
                valid2 = false;
                passingSchemas2 = [passingSchemas2, 1];
              } else {
                if (valid3) {
                  valid2 = prevValid2 = true;
                  passingSchemas2 = 1;
                }
              }
              if (!valid2) {
                var err = {
                  keyword: 'oneOf',
                  dataPath: (dataPath || '') + '/pattern/' + 0,
                  schemaPath: '#/properties/pattern/items/0/oneOf',
                  params: {
                    passingSchemas: passingSchemas2
                  },
                  message: 'should match exactly one schema in oneOf'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              } else {
                errors = errs__2;
                if (vErrors !== null) {
                  if (errs__2) vErrors.length = errs__2;
                  else vErrors = null;
                }
              }
              var valid2 = errors === errs_2;
            }
            valid2 = true;
            if (data1.length > 1) {
              var errs_2 = errors;
              if (typeof data1[1] !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/pattern/' + 1,
                  schemaPath: '#/properties/pattern/items/1/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
          } else {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/pattern',
              schemaPath: '#/properties/pattern/type',
              params: {
                type: 'array'
              },
              message: 'should be array'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var valid1 = errors === errs_1;
        }
        if (data.field !== undefined) {
          var errs_1 = errors;
          if (!refVal[3](data.field, (dataPath || '') + '/field', data, 'field', rootData)) {
            if (vErrors === null) vErrors = refVal[3].errors;
            else vErrors = vErrors.concat(refVal[3].errors);
            errors = vErrors.length;
          }
          var valid1 = errors === errs_1;
        }
        if (data.fields !== undefined) {
          var errs_1 = errors;
          if (!refVal4(data.fields, (dataPath || '') + '/fields', data, 'fields', rootData)) {
            if (vErrors === null) vErrors = refVal4.errors;
            else vErrors = vErrors.concat(refVal4.errors);
            errors = vErrors.length;
          }
          var valid1 = errors === errs_1;
        }
        if (data.types !== undefined) {
          var errs_1 = errors;
          if (!refVal[4](data.types, (dataPath || '') + '/types', data, 'types', rootData)) {
            if (vErrors === null) vErrors = refVal[4].errors;
            else vErrors = vErrors.concat(refVal[4].errors);
            errors = vErrors.length;
          }
          var valid1 = errors === errs_1;
        }
      } else {
        var err = {
          keyword: 'type',
          dataPath: (dataPath || '') + "",
          schemaPath: '#/type',
          params: {
            type: 'object'
          },
          message: 'should be object'
        };
        if (vErrors === null) vErrors = [err];
        else vErrors.push(err);
        errors++;
      }
      var schema0 = data && data.widget;
      var definition0 = RULES.custom['select'].definition;
      var keywordValidate0 = definition0.validate;
      keywordValidate0.errors = null;
      var errs__0 = errors;
      var valid0;
      if (schema0 === undefined) {
        valid0 = true;
      } else {
        valid0 = definition0.validateSchema(schema0);
        if (valid0) {
          keywordValidate0.errors = null;
          valid0 = keywordValidate0.call(self, schema0, data, validate.schema, (dataPath || ''), parentData, parentDataProperty, rootData);
        }
      }
      if (!valid0) {
        if (Array.isArray(keywordValidate0.errors)) {
          if (vErrors === null) vErrors = keywordValidate0.errors;
          else vErrors = vErrors.concat(keywordValidate0.errors);
          errors = vErrors.length;
          for (var i0 = errs__0; i0 < errors; i0++) {
            var ruleErr0 = vErrors[i0];
            if (ruleErr0.dataPath === undefined) ruleErr0.dataPath = (dataPath || '') + "";
            ruleErr0.schemaPath = "#/select";
          }
        } else {
          var err = {
            keyword: 'select',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/select',
            params: {
              keyword: 'select'
            },
            message: 'should pass "select" keyword validation'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
      }
      customRule14.errors = null;
      var errs__0 = errors;
      var valid0;
      customRule14.errors = null;
      valid0 = customRule14.call(self, data, (dataPath || ''), parentData, parentDataProperty, rootData);
      validate.errors = vErrors;
      return errors === 0;
    };
  })();
  refVal3.schema = {
    "$id": "field_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e",
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "widget": {
        "type": "string"
      },
      "required": {
        "type": "boolean"
      },
      "i18n": {
        "oneOf": [{
          "type": "boolean"
        }, {
          "type": "string",
          "enum": ["translate", "duplicate", "none"]
        }]
      },
      "hint": {
        "type": "string"
      },
      "pattern": {
        "type": "array",
        "minItems": 2,
        "items": [{
          "oneOf": [{
            "type": "string"
          }, {
            "instanceof": "RegExp"
          }]
        }, {
          "type": "string"
        }]
      },
      "field": {
        "$ref": "field_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e"
      },
      "fields": {
        "$ref": "fields_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e"
      },
      "types": {
        "$ref": "fields_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e"
      }
    },
    "select": {
      "$data": "0/widget"
    },
    "selectCases": {
      "unknown": {},
      "string": {},
      "number": {
        "properties": {
          "step": {
            "type": "number"
          },
          "value_type": {
            "type": "string"
          },
          "min": {
            "type": "number"
          },
          "max": {
            "type": "number"
          }
        }
      },
      "text": {},
      "image": {
        "properties": {
          "allow_multiple": {
            "type": "boolean"
          }
        }
      },
      "file": {
        "properties": {
          "allow_multiple": {
            "type": "boolean"
          }
        }
      },
      "select": {
        "properties": {
          "multiple": {
            "type": "boolean"
          },
          "min": {
            "type": "integer"
          },
          "max": {
            "type": "integer"
          },
          "options": {
            "type": "array",
            "items": {
              "oneOf": [{
                "type": "string"
              }, {
                "type": "number"
              }, {
                "type": "object",
                "properties": {
                  "label": {
                    "type": "string"
                  },
                  "value": {
                    "oneOf": [{
                      "type": "string"
                    }, {
                      "type": "number"
                    }]
                  }
                },
                "required": ["label", "value"]
              }]
            }
          }
        },
        "required": ["options"]
      },
      "markdown": {
        "properties": {
          "minimal": {
            "type": "boolean"
          },
          "buttons": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["bold", "italic", "code", "link", "heading-one", "heading-two", "heading-three", "heading-four", "heading-five", "heading-six", "quote", "bulleted-list", "numbered-list"]
            }
          },
          "editor_components": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "modes": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["raw", "rich_text"]
            },
            "minItems": 1
          }
        }
      },
      "list": {
        "properties": {
          "allow_add": {
            "type": "boolean"
          },
          "collapsed": {
            "type": "boolean"
          },
          "summary": {
            "type": "string"
          },
          "minimize_collapsed": {
            "type": "boolean"
          },
          "label_singular": {
            "type": "string"
          },
          "i18n": {
            "type": "boolean"
          },
          "min": {
            "type": "number"
          },
          "max": {
            "type": "number"
          }
        }
      },
      "object": {
        "properties": {
          "collapsed": {
            "type": "boolean"
          },
          "i18n": {
            "type": "boolean"
          }
        }
      },
      "relation": {
        "properties": {
          "collection": {
            "type": "string"
          },
          "value_field": {
            "type": "string"
          },
          "search_fields": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "string"
            }
          },
          "file": {
            "type": "string"
          },
          "multiple": {
            "type": "boolean"
          },
          "min": {
            "type": "integer"
          },
          "max": {
            "type": "integer"
          },
          "display_fields": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "string"
            }
          },
          "options_length": {
            "type": "integer"
          }
        },
        "oneOf": [{
          "required": ["collection", "value_field", "search_fields"]
        }, {
          "required": ["collection", "valueField", "searchFields"]
        }]
      },
      "boolean": {},
      "map": {
        "properties": {
          "decimals": {
            "type": "integer"
          },
          "type": {
            "type": "string",
            "enum": ["Point", "LineString", "Polygon"]
          }
        }
      },
      "date": {},
      "datetime": {
        "properties": {
          "format": {
            "type": "string"
          },
          "date_format": {
            "oneOf": [{
              "type": "string"
            }, {
              "type": "boolean"
            }]
          },
          "time_format": {
            "oneOf": [{
              "type": "string"
            }, {
              "type": "boolean"
            }]
          },
          "picker_utc": {
            "type": "boolean"
          }
        }
      },
      "code": {
        "properties": {
          "default_language": {
            "type": "string"
          },
          "allow_language_selection": {
            "type": "boolean"
          },
          "output_code_only": {
            "type": "boolean"
          },
          "keys": {
            "type": "object",
            "properties": {
              "code": {
                "type": "string"
              },
              "lang": {
                "type": "string"
              }
            }
          }
        }
      },
      "color": {}
    },
    "required": ["name"]
  };
  refVal3.errors = null;
  refVal[3] = refVal3;
  var refVal4 = (function() {
    var pattern0 = new RegExp('^[a-zA-Z-_]+$');
    return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
      'use strict'; /*# sourceURL=fields_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e */
      var vErrors = null;
      var errors = 0;
      if (rootData === undefined) rootData = data;
      if (Array.isArray(data)) {
        if (data.length < 1) {
          var err = {
            keyword: 'minItems',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/minItems',
            params: {
              limit: 1
            },
            message: 'should NOT have fewer than 1 items'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var errs__0 = errors;
        var valid0;
        for (var i0 = 0; i0 < data.length; i0++) {
          var data1 = data[i0];
          var errs_1 = errors;
          if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
            var errs__1 = errors;
            var valid2 = true;
            if (data1.name === undefined) {
              valid2 = false;
              var err = {
                keyword: 'required',
                dataPath: (dataPath || '') + '/' + i0,
                schemaPath: '#/items/required',
                params: {
                  missingProperty: 'name'
                },
                message: 'should have required property \'name\''
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            } else {
              var errs_2 = errors;
              if (typeof data1.name !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/name',
                  schemaPath: '#/items/properties/name/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.label !== undefined) {
              var errs_2 = errors;
              if (typeof data1.label !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/label',
                  schemaPath: '#/items/properties/label/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.widget !== undefined) {
              var errs_2 = errors;
              if (typeof data1.widget !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/widget',
                  schemaPath: '#/items/properties/widget/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.required !== undefined) {
              var errs_2 = errors;
              if (typeof data1.required !== "boolean") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/required',
                  schemaPath: '#/items/properties/required/type',
                  params: {
                    type: 'boolean'
                  },
                  message: 'should be boolean'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            var data2 = data1.i18n;
            if (data2 !== undefined) {
              var errs_2 = errors;
              var errs__2 = errors,
                prevValid2 = false,
                valid2 = false,
                passingSchemas2 = null;
              var errs_3 = errors;
              if (typeof data2 !== "boolean") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/i18n',
                  schemaPath: '#/items/properties/i18n/oneOf/0/type',
                  params: {
                    type: 'boolean'
                  },
                  message: 'should be boolean'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid3 = errors === errs_3;
              if (valid3) {
                valid2 = prevValid2 = true;
                passingSchemas2 = 0;
              }
              var errs_3 = errors;
              if (typeof data2 !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/i18n',
                  schemaPath: '#/items/properties/i18n/oneOf/1/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var schema3 = validate.schema.items.properties.i18n.oneOf[1].enum;
              var valid3;
              valid3 = false;
              for (var i3 = 0; i3 < schema3.length; i3++)
                if (equal(data2, schema3[i3])) {
                  valid3 = true;
                  break;
                } if (!valid3) {
                var err = {
                  keyword: 'enum',
                  dataPath: (dataPath || '') + '/' + i0 + '/i18n',
                  schemaPath: '#/items/properties/i18n/oneOf/1/enum',
                  params: {
                    allowedValues: schema3
                  },
                  message: 'should be equal to one of the allowed values'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid3 = errors === errs_3;
              if (valid3 && prevValid2) {
                valid2 = false;
                passingSchemas2 = [passingSchemas2, 1];
              } else {
                if (valid3) {
                  valid2 = prevValid2 = true;
                  passingSchemas2 = 1;
                }
              }
              if (!valid2) {
                var err = {
                  keyword: 'oneOf',
                  dataPath: (dataPath || '') + '/' + i0 + '/i18n',
                  schemaPath: '#/items/properties/i18n/oneOf',
                  params: {
                    passingSchemas: passingSchemas2
                  },
                  message: 'should match exactly one schema in oneOf'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              } else {
                errors = errs__2;
                if (vErrors !== null) {
                  if (errs__2) vErrors.length = errs__2;
                  else vErrors = null;
                }
              }
              var valid2 = errors === errs_2;
            }
            if (data1.hint !== undefined) {
              var errs_2 = errors;
              if (typeof data1.hint !== "string") {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/hint',
                  schemaPath: '#/items/properties/hint/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            var data2 = data1.pattern;
            if (data2 !== undefined) {
              var errs_2 = errors;
              if (Array.isArray(data2)) {
                if (data2.length < 2) {
                  var err = {
                    keyword: 'minItems',
                    dataPath: (dataPath || '') + '/' + i0 + '/pattern',
                    schemaPath: '#/items/properties/pattern/minItems',
                    params: {
                      limit: 2
                    },
                    message: 'should NOT have fewer than 2 items'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var errs__2 = errors;
                var valid2;
                valid3 = true;
                if (data2.length > 0) {
                  var data3 = data2[0];
                  var errs_3 = errors;
                  var errs__3 = errors,
                    prevValid3 = false,
                    valid3 = false,
                    passingSchemas3 = null;
                  var errs_4 = errors;
                  if (typeof data3 !== "string") {
                    var err = {
                      keyword: 'type',
                      dataPath: (dataPath || '') + '/' + i0 + '/pattern/' + 0,
                      schemaPath: '#/items/properties/pattern/items/0/oneOf/0/type',
                      params: {
                        type: 'string'
                      },
                      message: 'should be string'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var valid4 = errors === errs_4;
                  if (valid4) {
                    valid3 = prevValid3 = true;
                    passingSchemas3 = 0;
                  }
                  var errs_4 = errors;
                  customRule11.errors = null;
                  var errs__4 = errors;
                  var valid4;
                  customRule11.errors = null;
                  valid4 = customRule11.call(self, data3, (dataPath || '') + '/' + i0 + '/pattern/' + 0, data2, 0, rootData);
                  if (!valid4) {
                    if (Array.isArray(customRule11.errors)) {
                      if (vErrors === null) vErrors = customRule11.errors;
                      else vErrors = vErrors.concat(customRule11.errors);
                      errors = vErrors.length;
                      for (var i4 = errs__4; i4 < errors; i4++) {
                        var ruleErr4 = vErrors[i4];
                        if (ruleErr4.dataPath === undefined) ruleErr4.dataPath = (dataPath || '') + '/' + i0 + '/pattern/' + 0;
                        ruleErr4.schemaPath = "#/items/properties/pattern/items/0/oneOf/1/instanceof";
                      }
                    } else {
                      var err = {
                        keyword: 'instanceof',
                        dataPath: (dataPath || '') + '/' + i0 + '/pattern/' + 0,
                        schemaPath: '#/items/properties/pattern/items/0/oneOf/1/instanceof',
                        params: {
                          keyword: 'instanceof'
                        },
                        message: 'should pass "instanceof" keyword validation'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                  }
                  var valid4 = errors === errs_4;
                  if (valid4 && prevValid3) {
                    valid3 = false;
                    passingSchemas3 = [passingSchemas3, 1];
                  } else {
                    if (valid4) {
                      valid3 = prevValid3 = true;
                      passingSchemas3 = 1;
                    }
                  }
                  if (!valid3) {
                    var err = {
                      keyword: 'oneOf',
                      dataPath: (dataPath || '') + '/' + i0 + '/pattern/' + 0,
                      schemaPath: '#/items/properties/pattern/items/0/oneOf',
                      params: {
                        passingSchemas: passingSchemas3
                      },
                      message: 'should match exactly one schema in oneOf'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  } else {
                    errors = errs__3;
                    if (vErrors !== null) {
                      if (errs__3) vErrors.length = errs__3;
                      else vErrors = null;
                    }
                  }
                  var valid3 = errors === errs_3;
                }
                valid3 = true;
                if (data2.length > 1) {
                  var errs_3 = errors;
                  if (typeof data2[1] !== "string") {
                    var err = {
                      keyword: 'type',
                      dataPath: (dataPath || '') + '/' + i0 + '/pattern/' + 1,
                      schemaPath: '#/items/properties/pattern/items/1/type',
                      params: {
                        type: 'string'
                      },
                      message: 'should be string'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var valid3 = errors === errs_3;
                }
              } else {
                var err = {
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/' + i0 + '/pattern',
                  schemaPath: '#/items/properties/pattern/type',
                  params: {
                    type: 'array'
                  },
                  message: 'should be array'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.field !== undefined) {
              var errs_2 = errors;
              if (!refVal[3](data1.field, (dataPath || '') + '/' + i0 + '/field', data1, 'field', rootData)) {
                if (vErrors === null) vErrors = refVal[3].errors;
                else vErrors = vErrors.concat(refVal[3].errors);
                errors = vErrors.length;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.fields !== undefined) {
              var errs_2 = errors;
              if (!refVal[4](data1.fields, (dataPath || '') + '/' + i0 + '/fields', data1, 'fields', rootData)) {
                if (vErrors === null) vErrors = refVal[4].errors;
                else vErrors = vErrors.concat(refVal[4].errors);
                errors = vErrors.length;
              }
              var valid2 = errors === errs_2;
            }
            if (data1.types !== undefined) {
              var errs_2 = errors;
              if (!refVal[4](data1.types, (dataPath || '') + '/' + i0 + '/types', data1, 'types', rootData)) {
                if (vErrors === null) vErrors = refVal[4].errors;
                else vErrors = vErrors.concat(refVal[4].errors);
                errors = vErrors.length;
              }
              var valid2 = errors === errs_2;
            }
          } else {
            var err = {
              keyword: 'type',
              dataPath: (dataPath || '') + '/' + i0,
              schemaPath: '#/items/type',
              params: {
                type: 'object'
              },
              message: 'should be object'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var schema1 = data1 && data1.widget;
          var definition1 = RULES.custom['select'].definition;
          var keywordValidate1 = definition1.validate;
          keywordValidate1.errors = null;
          var errs__1 = errors;
          var valid1;
          if (schema1 === undefined) {
            valid1 = true;
          } else {
            valid1 = definition1.validateSchema(schema1);
            if (valid1) {
              keywordValidate1.errors = null;
              valid1 = keywordValidate1.call(self, schema1, data1, validate.schema.items, (dataPath || '') + '/' + i0, data, i0, rootData);
            }
          }
          if (!valid1) {
            if (Array.isArray(keywordValidate1.errors)) {
              if (vErrors === null) vErrors = keywordValidate1.errors;
              else vErrors = vErrors.concat(keywordValidate1.errors);
              errors = vErrors.length;
              for (var i1 = errs__1; i1 < errors; i1++) {
                var ruleErr1 = vErrors[i1];
                if (ruleErr1.dataPath === undefined) ruleErr1.dataPath = (dataPath || '') + '/' + i0;
                ruleErr1.schemaPath = "#/items/select";
              }
            } else {
              var err = {
                keyword: 'select',
                dataPath: (dataPath || '') + '/' + i0,
                schemaPath: '#/items/select',
                params: {
                  keyword: 'select'
                },
                message: 'should pass "select" keyword validation'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
          }
          customRule12.errors = null;
          var errs__1 = errors;
          var valid1;
          customRule12.errors = null;
          valid1 = customRule12.call(self, data1, (dataPath || '') + '/' + i0, data, i0, rootData);
          var valid1 = errors === errs_1;
        }
        customRule13.errors = null;
        var errs__0 = errors;
        var valid0;
        customRule13.errors = null;
        valid0 = customRule13.call(self, data, (dataPath || ''), parentData, parentDataProperty, rootData);
        if (!valid0) {
          if (Array.isArray(customRule13.errors)) {
            if (vErrors === null) vErrors = customRule13.errors;
            else vErrors = vErrors.concat(customRule13.errors);
            errors = vErrors.length;
            for (var i0 = errs__0; i0 < errors; i0++) {
              var ruleErr0 = vErrors[i0];
              if (ruleErr0.dataPath === undefined) ruleErr0.dataPath = (dataPath || '') + "";
              ruleErr0.schemaPath = "#/uniqueItemProperties";
            }
          } else {
            var err = {
              keyword: 'uniqueItemProperties',
              dataPath: (dataPath || '') + "",
              schemaPath: '#/uniqueItemProperties',
              params: {
                keyword: 'uniqueItemProperties'
              },
              message: 'should pass "uniqueItemProperties" keyword validation'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
        }
      } else {
        var err = {
          keyword: 'type',
          dataPath: (dataPath || '') + "",
          schemaPath: '#/type',
          params: {
            type: 'array'
          },
          message: 'should be array'
        };
        if (vErrors === null) vErrors = [err];
        else vErrors.push(err);
        errors++;
      }
      validate.errors = vErrors;
      return errors === 0;
    };
  })();
  refVal4.schema = {
    "$id": "fields_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e",
    "type": "array",
    "minItems": 1,
    "items": {
      "$id": "field_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e",
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "widget": {
          "type": "string"
        },
        "required": {
          "type": "boolean"
        },
        "i18n": {
          "oneOf": [{
            "type": "boolean"
          }, {
            "type": "string",
            "enum": ["translate", "duplicate", "none"]
          }]
        },
        "hint": {
          "type": "string"
        },
        "pattern": {
          "type": "array",
          "minItems": 2,
          "items": [{
            "oneOf": [{
              "type": "string"
            }, {
              "instanceof": "RegExp"
            }]
          }, {
            "type": "string"
          }]
        },
        "field": {
          "$ref": "field_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e"
        },
        "fields": {
          "$ref": "fields_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e"
        },
        "types": {
          "$ref": "fields_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e"
        }
      },
      "select": {
        "$data": "0/widget"
      },
      "selectCases": {
        "unknown": {},
        "string": {},
        "number": {
          "properties": {
            "step": {
              "type": "number"
            },
            "value_type": {
              "type": "string"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            }
          }
        },
        "text": {},
        "image": {
          "properties": {
            "allow_multiple": {
              "type": "boolean"
            }
          }
        },
        "file": {
          "properties": {
            "allow_multiple": {
              "type": "boolean"
            }
          }
        },
        "select": {
          "properties": {
            "multiple": {
              "type": "boolean"
            },
            "min": {
              "type": "integer"
            },
            "max": {
              "type": "integer"
            },
            "options": {
              "type": "array",
              "items": {
                "oneOf": [{
                  "type": "string"
                }, {
                  "type": "number"
                }, {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "oneOf": [{
                        "type": "string"
                      }, {
                        "type": "number"
                      }]
                    }
                  },
                  "required": ["label", "value"]
                }]
              }
            }
          },
          "required": ["options"]
        },
        "markdown": {
          "properties": {
            "minimal": {
              "type": "boolean"
            },
            "buttons": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["bold", "italic", "code", "link", "heading-one", "heading-two", "heading-three", "heading-four", "heading-five", "heading-six", "quote", "bulleted-list", "numbered-list"]
              }
            },
            "editor_components": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "modes": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["raw", "rich_text"]
              },
              "minItems": 1
            }
          }
        },
        "list": {
          "properties": {
            "allow_add": {
              "type": "boolean"
            },
            "collapsed": {
              "type": "boolean"
            },
            "summary": {
              "type": "string"
            },
            "minimize_collapsed": {
              "type": "boolean"
            },
            "label_singular": {
              "type": "string"
            },
            "i18n": {
              "type": "boolean"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            }
          }
        },
        "object": {
          "properties": {
            "collapsed": {
              "type": "boolean"
            },
            "i18n": {
              "type": "boolean"
            }
          }
        },
        "relation": {
          "properties": {
            "collection": {
              "type": "string"
            },
            "value_field": {
              "type": "string"
            },
            "search_fields": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "string"
              }
            },
            "file": {
              "type": "string"
            },
            "multiple": {
              "type": "boolean"
            },
            "min": {
              "type": "integer"
            },
            "max": {
              "type": "integer"
            },
            "display_fields": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "string"
              }
            },
            "options_length": {
              "type": "integer"
            }
          },
          "oneOf": [{
            "required": ["collection", "value_field", "search_fields"]
          }, {
            "required": ["collection", "valueField", "searchFields"]
          }]
        },
        "boolean": {},
        "map": {
          "properties": {
            "decimals": {
              "type": "integer"
            },
            "type": {
              "type": "string",
              "enum": ["Point", "LineString", "Polygon"]
            }
          }
        },
        "date": {},
        "datetime": {
          "properties": {
            "format": {
              "type": "string"
            },
            "date_format": {
              "oneOf": [{
                "type": "string"
              }, {
                "type": "boolean"
              }]
            },
            "time_format": {
              "oneOf": [{
                "type": "string"
              }, {
                "type": "boolean"
              }]
            },
            "picker_utc": {
              "type": "boolean"
            }
          }
        },
        "code": {
          "properties": {
            "default_language": {
              "type": "string"
            },
            "allow_language_selection": {
              "type": "boolean"
            },
            "output_code_only": {
              "type": "boolean"
            },
            "keys": {
              "type": "object",
              "properties": {
                "code": {
                  "type": "string"
                },
                "lang": {
                  "type": "string"
                }
              }
            }
          }
        },
        "color": {}
      },
      "required": ["name"]
    },
    "uniqueItemProperties": ["name"]
  };
  refVal4.errors = null;
  refVal[4] = refVal4;
  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
    'use strict'; /*# sourceURL=https://netlify-cms/object.json */
    var vErrors = null;
    var errors = 0;
    if (rootData === undefined) rootData = data;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      var errs__0 = errors;
      var valid1 = true;
      var data1 = data.backend;
      if (data1 === undefined) {
        valid1 = false;
        var err = {
          keyword: 'required',
          dataPath: (dataPath || '') + "",
          schemaPath: '#/required',
          params: {
            missingProperty: 'backend'
          },
          message: 'should have required property \'backend\''
        };
        if (vErrors === null) vErrors = [err];
        else vErrors.push(err);
        errors++;
      } else {
        var errs_1 = errors;
        if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
          var errs__1 = errors;
          var valid2 = true;
          if (data1.name === undefined) {
            valid2 = false;
            var err = {
              keyword: 'required',
              dataPath: (dataPath || '') + '/backend',
              schemaPath: '#/properties/backend/required',
              params: {
                missingProperty: 'name'
              },
              message: 'should have required property \'name\''
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          } else {
            var errs_2 = errors;
            if (typeof data1.name !== "string") {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/backend/name',
                schemaPath: '#/properties/backend/properties/name/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
          var data2 = data1.auth_scope;
          if (data2 !== undefined) {
            var errs_2 = errors;
            if (typeof data2 !== "string") {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/backend/auth_scope',
                schemaPath: '#/properties/backend/properties/auth_scope/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var schema2 = validate.schema.properties.backend.properties.auth_scope.enum;
            var valid2;
            valid2 = false;
            for (var i2 = 0; i2 < schema2.length; i2++)
              if (equal(data2, schema2[i2])) {
                valid2 = true;
                break;
              } if (!valid2) {
              var err = {
                keyword: 'enum',
                dataPath: (dataPath || '') + '/backend/auth_scope',
                schemaPath: '#/properties/backend/properties/auth_scope/enum',
                params: {
                  allowedValues: schema2
                },
                message: 'should be equal to one of the allowed values'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
          var data2 = data1.cms_label_prefix;
          if (data2 !== undefined) {
            var errs_2 = errors;
            if (typeof data2 === "string") {
              if (ucs2length(data2) < 1) {
                var err = {
                  keyword: 'minLength',
                  dataPath: (dataPath || '') + '/backend/cms_label_prefix',
                  schemaPath: '#/properties/backend/properties/cms_label_prefix/minLength',
                  params: {
                    limit: 1
                  },
                  message: 'should NOT be shorter than 1 characters'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
            } else {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/backend/cms_label_prefix',
                schemaPath: '#/properties/backend/properties/cms_label_prefix/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
          if (data1.open_authoring !== undefined) {
            var errs_2 = errors;
            if (typeof data1.open_authoring !== "boolean") {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/backend/open_authoring',
                schemaPath: '#/properties/backend/properties/open_authoring/type',
                params: {
                  type: 'boolean'
                },
                message: 'should be boolean'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
        } else {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/backend',
            schemaPath: '#/properties/backend/type',
            params: {
              type: 'object'
            },
            message: 'should be object'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      var data1 = data.local_backend;
      if (data1 !== undefined) {
        var errs_1 = errors;
        var errs__1 = errors,
          prevValid1 = false,
          valid1 = false,
          passingSchemas1 = null;
        var errs_2 = errors;
        if (typeof data1 !== "boolean") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/local_backend',
            schemaPath: '#/properties/local_backend/oneOf/0/type',
            params: {
              type: 'boolean'
            },
            message: 'should be boolean'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid2 = errors === errs_2;
        if (valid2) {
          valid1 = prevValid1 = true;
          passingSchemas1 = 0;
        }
        var errs_2 = errors;
        if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
          var errs__2 = errors;
          var valid3 = true;
          for (var key2 in data1) {
            var isAdditional2 = !(false || key2 == 'url' || key2 == 'allowed_hosts');
            if (isAdditional2) {
              valid3 = false;
              var err = {
                keyword: 'additionalProperties',
                dataPath: (dataPath || '') + '/local_backend',
                schemaPath: '#/properties/local_backend/oneOf/1/additionalProperties',
                params: {
                  additionalProperty: '' + key2 + ''
                },
                message: 'should NOT have additional properties'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
          }
          if (data1.url !== undefined) {
            var errs_3 = errors;
            if (typeof data1.url !== "string") {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/local_backend/url',
                schemaPath: '#/properties/local_backend/oneOf/1/properties/url/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid3 = errors === errs_3;
          }
          var data2 = data1.allowed_hosts;
          if (data2 !== undefined) {
            var errs_3 = errors;
            if (Array.isArray(data2)) {
              var errs__3 = errors;
              var valid3;
              for (var i3 = 0; i3 < data2.length; i3++) {
                var errs_4 = errors;
                if (typeof data2[i3] !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/local_backend/allowed_hosts/' + i3,
                    schemaPath: '#/properties/local_backend/oneOf/1/properties/allowed_hosts/items/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid4 = errors === errs_4;
              }
            } else {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/local_backend/allowed_hosts',
                schemaPath: '#/properties/local_backend/oneOf/1/properties/allowed_hosts/type',
                params: {
                  type: 'array'
                },
                message: 'should be array'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid3 = errors === errs_3;
          }
        } else {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/local_backend',
            schemaPath: '#/properties/local_backend/oneOf/1/type',
            params: {
              type: 'object'
            },
            message: 'should be object'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid2 = errors === errs_2;
        if (valid2 && prevValid1) {
          valid1 = false;
          passingSchemas1 = [passingSchemas1, 1];
        } else {
          if (valid2) {
            valid1 = prevValid1 = true;
            passingSchemas1 = 1;
          }
        }
        if (!valid1) {
          var err = {
            keyword: 'oneOf',
            dataPath: (dataPath || '') + '/local_backend',
            schemaPath: '#/properties/local_backend/oneOf',
            params: {
              passingSchemas: passingSchemas1
            },
            message: 'should match exactly one schema in oneOf'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        } else {
          errors = errs__1;
          if (vErrors !== null) {
            if (errs__1) vErrors.length = errs__1;
            else vErrors = null;
          }
        }
        var valid1 = errors === errs_1;
      }
      if (data.locale !== undefined) {
        var errs_1 = errors;
        if (typeof data.locale !== "string") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/locale',
            schemaPath: '#/properties/locale/type',
            params: {
              type: 'string'
            },
            message: 'should be string'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      var data1 = data.i18n;
      if (data1 !== undefined) {
        var errs_1 = errors;
        if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
          var errs__1 = errors;
          var valid2 = true;
          var data2 = data1.structure;
          if (data2 === undefined) {
            valid2 = false;
            var err = {
              keyword: 'required',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/required',
              params: {
                missingProperty: 'structure'
              },
              message: 'should have required property \'structure\''
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          } else {
            var errs_2 = errors;
            if (typeof data2 !== "string") {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/i18n/structure',
                schemaPath: '#/properties/i18n/properties/structure/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var schema2 = validate.schema.properties.i18n.properties.structure.enum;
            var valid2;
            valid2 = false;
            for (var i2 = 0; i2 < schema2.length; i2++)
              if (equal(data2, schema2[i2])) {
                valid2 = true;
                break;
              } if (!valid2) {
              var err = {
                keyword: 'enum',
                dataPath: (dataPath || '') + '/i18n/structure',
                schemaPath: '#/properties/i18n/properties/structure/enum',
                params: {
                  allowedValues: schema2
                },
                message: 'should be equal to one of the allowed values'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
          var data2 = data1.locales;
          if (data2 === undefined) {
            valid2 = false;
            var err = {
              keyword: 'required',
              dataPath: (dataPath || '') + '/i18n',
              schemaPath: '#/properties/i18n/required',
              params: {
                missingProperty: 'locales'
              },
              message: 'should have required property \'locales\''
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          } else {
            var errs_2 = errors;
            if (Array.isArray(data2)) {
              if (data2.length < 2) {
                var err = {
                  keyword: 'minItems',
                  dataPath: (dataPath || '') + '/i18n/locales',
                  schemaPath: '#/properties/i18n/properties/locales/minItems',
                  params: {
                    limit: 2
                  },
                  message: 'should NOT have fewer than 2 items'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var errs__2 = errors;
              var valid2;
              for (var i2 = 0; i2 < data2.length; i2++) {
                var data3 = data2[i2];
                var errs_3 = errors;
                if (typeof data3 === "string") {
                  if (ucs2length(data3) > 10) {
                    var err = {
                      keyword: 'maxLength',
                      dataPath: (dataPath || '') + '/i18n/locales/' + i2,
                      schemaPath: '#/properties/i18n/properties/locales/items/maxLength',
                      params: {
                        limit: 10
                      },
                      message: 'should NOT be longer than 10 characters'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  if (ucs2length(data3) < 2) {
                    var err = {
                      keyword: 'minLength',
                      dataPath: (dataPath || '') + '/i18n/locales/' + i2,
                      schemaPath: '#/properties/i18n/properties/locales/items/minLength',
                      params: {
                        limit: 2
                      },
                      message: 'should NOT be shorter than 2 characters'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  if (!pattern0.test(data3)) {
                    var err = {
                      keyword: 'pattern',
                      dataPath: (dataPath || '') + '/i18n/locales/' + i2,
                      schemaPath: '#/properties/i18n/properties/locales/items/pattern',
                      params: {
                        pattern: '^[a-zA-Z-_]+$'
                      },
                      message: 'should match pattern "^[a-zA-Z-_]+$"'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/i18n/locales/' + i2,
                    schemaPath: '#/properties/i18n/properties/locales/items/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var i = data2.length,
                valid2 = true,
                j;
              if (i > 1) {
                var itemIndices = {},
                  item;
                for (; i--;) {
                  var item = data2[i];
                  if (typeof item !== "string") continue;
                  if (typeof itemIndices[item] == 'number') {
                    valid2 = false;
                    j = itemIndices[item];
                    break;
                  }
                  itemIndices[item] = i;
                }
              }
              if (!valid2) {
                var err = {
                  keyword: 'uniqueItems',
                  dataPath: (dataPath || '') + '/i18n/locales',
                  schemaPath: '#/properties/i18n/properties/locales/uniqueItems',
                  params: {
                    i: i,
                    j: j
                  },
                  message: 'should NOT have duplicate items (items ## ' + j + ' and ' + i + ' are identical)'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
            } else {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/i18n/locales',
                schemaPath: '#/properties/i18n/properties/locales/type',
                params: {
                  type: 'array'
                },
                message: 'should be array'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
          var data2 = data1.default_locale;
          if (data2 !== undefined) {
            var errs_2 = errors;
            if (typeof data2 === "string") {
              if (ucs2length(data2) > 10) {
                var err = {
                  keyword: 'maxLength',
                  dataPath: (dataPath || '') + '/i18n/default_locale',
                  schemaPath: '#/properties/i18n/properties/default_locale/maxLength',
                  params: {
                    limit: 10
                  },
                  message: 'should NOT be longer than 10 characters'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              if (ucs2length(data2) < 2) {
                var err = {
                  keyword: 'minLength',
                  dataPath: (dataPath || '') + '/i18n/default_locale',
                  schemaPath: '#/properties/i18n/properties/default_locale/minLength',
                  params: {
                    limit: 2
                  },
                  message: 'should NOT be shorter than 2 characters'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              if (!pattern0.test(data2)) {
                var err = {
                  keyword: 'pattern',
                  dataPath: (dataPath || '') + '/i18n/default_locale',
                  schemaPath: '#/properties/i18n/properties/default_locale/pattern',
                  params: {
                    pattern: '^[a-zA-Z-_]+$'
                  },
                  message: 'should match pattern "^[a-zA-Z-_]+$"'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
            } else {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/i18n/default_locale',
                schemaPath: '#/properties/i18n/properties/default_locale/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
        } else {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/i18n',
            schemaPath: '#/properties/i18n/type',
            params: {
              type: 'object'
            },
            message: 'should be object'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      if (data.site_url !== undefined) {
        var errs_1 = errors;
        if (typeof data.site_url !== "string") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/site_url',
            schemaPath: '#/properties/site_url/type',
            params: {
              type: 'string'
            },
            message: 'should be string'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      if (data.display_url !== undefined) {
        var errs_1 = errors;
        if (typeof data.display_url !== "string") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/display_url',
            schemaPath: '#/properties/display_url/type',
            params: {
              type: 'string'
            },
            message: 'should be string'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      if (data.logo_url !== undefined) {
        var errs_1 = errors;
        if (typeof data.logo_url !== "string") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/logo_url',
            schemaPath: '#/properties/logo_url/type',
            params: {
              type: 'string'
            },
            message: 'should be string'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      if (data.show_preview_links !== undefined) {
        var errs_1 = errors;
        if (typeof data.show_preview_links !== "boolean") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/show_preview_links',
            schemaPath: '#/properties/show_preview_links/type',
            params: {
              type: 'boolean'
            },
            message: 'should be boolean'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      if (data.media_folder !== undefined) {
        var errs_1 = errors;
        if (typeof data.media_folder !== "string") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/media_folder',
            schemaPath: '#/properties/media_folder/type',
            params: {
              type: 'string'
            },
            message: 'should be string'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      if (data.public_folder !== undefined) {
        var errs_1 = errors;
        if (typeof data.public_folder !== "string") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/public_folder',
            schemaPath: '#/properties/public_folder/type',
            params: {
              type: 'string'
            },
            message: 'should be string'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      if (data.media_folder_relative !== undefined) {
        var errs_1 = errors;
        if (typeof data.media_folder_relative !== "boolean") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/media_folder_relative',
            schemaPath: '#/properties/media_folder_relative/type',
            params: {
              type: 'boolean'
            },
            message: 'should be boolean'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      var data1 = data.media_library;
      if (data1 !== undefined) {
        var errs_1 = errors;
        if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
          var errs__1 = errors;
          var valid2 = true;
          if (data1.name === undefined) {
            valid2 = false;
            var err = {
              keyword: 'required',
              dataPath: (dataPath || '') + '/media_library',
              schemaPath: '#/properties/media_library/required',
              params: {
                missingProperty: 'name'
              },
              message: 'should have required property \'name\''
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          } else {
            var errs_2 = errors;
            if (typeof data1.name !== "string") {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/media_library/name',
                schemaPath: '#/properties/media_library/properties/name/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
          var data2 = data1.config;
          if (data2 !== undefined) {
            var errs_2 = errors;
            if ((!data2 || typeof data2 !== "object" || Array.isArray(data2))) {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/media_library/config',
                schemaPath: '#/properties/media_library/properties/config/type',
                params: {
                  type: 'object'
                },
                message: 'should be object'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
        } else {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/media_library',
            schemaPath: '#/properties/media_library/type',
            params: {
              type: 'object'
            },
            message: 'should be object'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      var data1 = data.publish_mode;
      if (data1 !== undefined) {
        var errs_1 = errors;
        if (typeof data1 !== "string") {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/publish_mode',
            schemaPath: '#/properties/publish_mode/type',
            params: {
              type: 'string'
            },
            message: 'should be string'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var schema1 = validate.schema.properties.publish_mode.enum;
        var valid1;
        valid1 = false;
        for (var i1 = 0; i1 < schema1.length; i1++)
          if (equal(data1, schema1[i1])) {
            valid1 = true;
            break;
          } if (!valid1) {
          var err = {
            keyword: 'enum',
            dataPath: (dataPath || '') + '/publish_mode',
            schemaPath: '#/properties/publish_mode/enum',
            params: {
              allowedValues: schema1
            },
            message: 'should be equal to one of the allowed values'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      var data1 = data.slug;
      if (data1 !== undefined) {
        var errs_1 = errors;
        if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
          var errs__1 = errors;
          var valid2 = true;
          var data2 = data1.encoding;
          if (data2 !== undefined) {
            var errs_2 = errors;
            if (typeof data2 !== "string") {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/slug/encoding',
                schemaPath: '#/properties/slug/properties/encoding/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var schema2 = validate.schema.properties.slug.properties.encoding.enum;
            var valid2;
            valid2 = false;
            for (var i2 = 0; i2 < schema2.length; i2++)
              if (equal(data2, schema2[i2])) {
                valid2 = true;
                break;
              } if (!valid2) {
              var err = {
                keyword: 'enum',
                dataPath: (dataPath || '') + '/slug/encoding',
                schemaPath: '#/properties/slug/properties/encoding/enum',
                params: {
                  allowedValues: schema2
                },
                message: 'should be equal to one of the allowed values'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
          if (data1.clean_accents !== undefined) {
            var errs_2 = errors;
            if (typeof data1.clean_accents !== "boolean") {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/slug/clean_accents',
                schemaPath: '#/properties/slug/properties/clean_accents/type',
                params: {
                  type: 'boolean'
                },
                message: 'should be boolean'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
        } else {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/slug',
            schemaPath: '#/properties/slug/type',
            params: {
              type: 'object'
            },
            message: 'should be object'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      var data1 = data.collections;
      if (data1 === undefined) {
        valid1 = false;
        var err = {
          keyword: 'required',
          dataPath: (dataPath || '') + "",
          schemaPath: '#/required',
          params: {
            missingProperty: 'collections'
          },
          message: 'should have required property \'collections\''
        };
        if (vErrors === null) vErrors = [err];
        else vErrors.push(err);
        errors++;
      } else {
        var errs_1 = errors;
        if (Array.isArray(data1)) {
          if (data1.length < 1) {
            var err = {
              keyword: 'minItems',
              dataPath: (dataPath || '') + '/collections',
              schemaPath: '#/properties/collections/minItems',
              params: {
                limit: 1
              },
              message: 'should NOT have fewer than 1 items'
            };
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
          }
          var errs__1 = errors;
          var valid1;
          for (var i1 = 0; i1 < data1.length; i1++) {
            var data2 = data1[i1];
            var errs_2 = errors;
            if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
              var errs__2 = errors;
              var missing2;
              valid3 = true;
              if (data2.frontmatter_delimiter !== undefined) {
                var errs_3 = errors;
                if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
                  var errs__3 = errors;
                  var valid4 = true;
                  if (data2.format === undefined) {
                    valid4 = false;
                    var err = {
                      keyword: 'required',
                      dataPath: (dataPath || '') + '/collections/' + i1,
                      schemaPath: '#/properties/collections/items/dependencies/frontmatter_delimiter/required',
                      params: {
                        missingProperty: 'format'
                      },
                      message: 'should have required property \'format\''
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  } else {
                    var errs_4 = errors;
                    var schema4 = validate.schema.properties.collections.items.dependencies.frontmatter_delimiter.properties.format.enum;
                    var valid4;
                    valid4 = false;
                    for (var i4 = 0; i4 < schema4.length; i4++)
                      if (equal(data2.format, schema4[i4])) {
                        valid4 = true;
                        break;
                      } if (!valid4) {
                      var err = {
                        keyword: 'enum',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/format',
                        schemaPath: '#/properties/collections/items/dependencies/frontmatter_delimiter/properties/format/enum',
                        params: {
                          allowedValues: schema4
                        },
                        message: 'should be equal to one of the allowed values'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                }
                var valid3 = errors === errs_3;
              }
              var errs__2 = errors;
              var valid3 = true;
              if (data2.name === undefined) {
                valid3 = false;
                var err = {
                  keyword: 'required',
                  dataPath: (dataPath || '') + '/collections/' + i1,
                  schemaPath: '#/properties/collections/items/required',
                  params: {
                    missingProperty: 'name'
                  },
                  message: 'should have required property \'name\''
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              } else {
                var errs_3 = errors;
                if (typeof data2.name !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/name',
                    schemaPath: '#/properties/collections/items/properties/name/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.label === undefined) {
                valid3 = false;
                var err = {
                  keyword: 'required',
                  dataPath: (dataPath || '') + '/collections/' + i1,
                  schemaPath: '#/properties/collections/items/required',
                  params: {
                    missingProperty: 'label'
                  },
                  message: 'should have required property \'label\''
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              } else {
                var errs_3 = errors;
                if (typeof data2.label !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/label',
                    schemaPath: '#/properties/collections/items/properties/label/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.label_singular !== undefined) {
                var errs_3 = errors;
                if (typeof data2.label_singular !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/label_singular',
                    schemaPath: '#/properties/collections/items/properties/label_singular/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.description !== undefined) {
                var errs_3 = errors;
                if (typeof data2.description !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/description',
                    schemaPath: '#/properties/collections/items/properties/description/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.folder !== undefined) {
                var errs_3 = errors;
                if (typeof data2.folder !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/folder',
                    schemaPath: '#/properties/collections/items/properties/folder/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.files;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if (Array.isArray(data3)) {
                  var errs__3 = errors;
                  var valid3;
                  for (var i3 = 0; i3 < data3.length; i3++) {
                    var data4 = data3[i3];
                    var errs_4 = errors;
                    if ((data4 && typeof data4 === "object" && !Array.isArray(data4))) {
                      var errs__4 = errors;
                      var valid5 = true;
                      if (data4.name === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3,
                          schemaPath: '#/properties/collections/items/properties/files/items/required',
                          params: {
                            missingProperty: 'name'
                          },
                          message: 'should have required property \'name\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.name !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/name',
                            schemaPath: '#/properties/collections/items/properties/files/items/properties/name/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.label === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3,
                          schemaPath: '#/properties/collections/items/properties/files/items/required',
                          params: {
                            missingProperty: 'label'
                          },
                          message: 'should have required property \'label\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.label !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/label',
                            schemaPath: '#/properties/collections/items/properties/files/items/properties/label/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.label_singular !== undefined) {
                        var errs_5 = errors;
                        if (typeof data4.label_singular !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/label_singular',
                            schemaPath: '#/properties/collections/items/properties/files/items/properties/label_singular/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.description !== undefined) {
                        var errs_5 = errors;
                        if (typeof data4.description !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/description',
                            schemaPath: '#/properties/collections/items/properties/files/items/properties/description/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.file === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3,
                          schemaPath: '#/properties/collections/items/properties/files/items/required',
                          params: {
                            missingProperty: 'file'
                          },
                          message: 'should have required property \'file\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.file !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/file',
                            schemaPath: '#/properties/collections/items/properties/files/items/properties/file/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.preview_path !== undefined) {
                        var errs_5 = errors;
                        if (typeof data4.preview_path !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/preview_path',
                            schemaPath: '#/properties/collections/items/properties/files/items/properties/preview_path/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.preview_path_date_field !== undefined) {
                        var errs_5 = errors;
                        if (typeof data4.preview_path_date_field !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/preview_path_date_field',
                            schemaPath: '#/properties/collections/items/properties/files/items/properties/preview_path_date_field/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      var data5 = data4.fields;
                      if (data5 === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3,
                          schemaPath: '#/properties/collections/items/properties/files/items/required',
                          params: {
                            missingProperty: 'fields'
                          },
                          message: 'should have required property \'fields\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (Array.isArray(data5)) {
                          if (data5.length < 1) {
                            var err = {
                              keyword: 'minItems',
                              dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields',
                              schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/minItems',
                              params: {
                                limit: 1
                              },
                              message: 'should NOT have fewer than 1 items'
                            };
                            if (vErrors === null) vErrors = [err];
                            else vErrors.push(err);
                            errors++;
                          }
                          var errs__5 = errors;
                          var valid5;
                          for (var i5 = 0; i5 < data5.length; i5++) {
                            var data6 = data5[i5];
                            var errs_6 = errors;
                            if ((data6 && typeof data6 === "object" && !Array.isArray(data6))) {
                              var errs__6 = errors;
                              var valid7 = true;
                              if (data6.name === undefined) {
                                valid7 = false;
                                var err = {
                                  keyword: 'required',
                                  dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5,
                                  schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/required',
                                  params: {
                                    missingProperty: 'name'
                                  },
                                  message: 'should have required property \'name\''
                                };
                                if (vErrors === null) vErrors = [err];
                                else vErrors.push(err);
                                errors++;
                              } else {
                                var errs_7 = errors;
                                if (typeof data6.name !== "string") {
                                  var err = {
                                    keyword: 'type',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/name',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/name/type',
                                    params: {
                                      type: 'string'
                                    },
                                    message: 'should be string'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                }
                                var valid7 = errors === errs_7;
                              }
                              if (data6.label !== undefined) {
                                var errs_7 = errors;
                                if (typeof data6.label !== "string") {
                                  var err = {
                                    keyword: 'type',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/label',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/label/type',
                                    params: {
                                      type: 'string'
                                    },
                                    message: 'should be string'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                }
                                var valid7 = errors === errs_7;
                              }
                              if (data6.widget !== undefined) {
                                var errs_7 = errors;
                                if (typeof data6.widget !== "string") {
                                  var err = {
                                    keyword: 'type',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/widget',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/widget/type',
                                    params: {
                                      type: 'string'
                                    },
                                    message: 'should be string'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                }
                                var valid7 = errors === errs_7;
                              }
                              if (data6.required !== undefined) {
                                var errs_7 = errors;
                                if (typeof data6.required !== "boolean") {
                                  var err = {
                                    keyword: 'type',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/required',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/required/type',
                                    params: {
                                      type: 'boolean'
                                    },
                                    message: 'should be boolean'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                }
                                var valid7 = errors === errs_7;
                              }
                              var data7 = data6.i18n;
                              if (data7 !== undefined) {
                                var errs_7 = errors;
                                var errs__7 = errors,
                                  prevValid7 = false,
                                  valid7 = false,
                                  passingSchemas7 = null;
                                var errs_8 = errors;
                                if (typeof data7 !== "boolean") {
                                  var err = {
                                    keyword: 'type',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/i18n',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/i18n/oneOf/0/type',
                                    params: {
                                      type: 'boolean'
                                    },
                                    message: 'should be boolean'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                }
                                var valid8 = errors === errs_8;
                                if (valid8) {
                                  valid7 = prevValid7 = true;
                                  passingSchemas7 = 0;
                                }
                                var errs_8 = errors;
                                if (typeof data7 !== "string") {
                                  var err = {
                                    keyword: 'type',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/i18n',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/i18n/oneOf/1/type',
                                    params: {
                                      type: 'string'
                                    },
                                    message: 'should be string'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                }
                                var schema8 = validate.schema.properties.collections.items.properties.files.items.properties.fields.items.properties.i18n.oneOf[1].enum;
                                var valid8;
                                valid8 = false;
                                for (var i8 = 0; i8 < schema8.length; i8++)
                                  if (equal(data7, schema8[i8])) {
                                    valid8 = true;
                                    break;
                                  } if (!valid8) {
                                  var err = {
                                    keyword: 'enum',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/i18n',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/i18n/oneOf/1/enum',
                                    params: {
                                      allowedValues: schema8
                                    },
                                    message: 'should be equal to one of the allowed values'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                }
                                var valid8 = errors === errs_8;
                                if (valid8 && prevValid7) {
                                  valid7 = false;
                                  passingSchemas7 = [passingSchemas7, 1];
                                } else {
                                  if (valid8) {
                                    valid7 = prevValid7 = true;
                                    passingSchemas7 = 1;
                                  }
                                }
                                if (!valid7) {
                                  var err = {
                                    keyword: 'oneOf',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/i18n',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/i18n/oneOf',
                                    params: {
                                      passingSchemas: passingSchemas7
                                    },
                                    message: 'should match exactly one schema in oneOf'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                } else {
                                  errors = errs__7;
                                  if (vErrors !== null) {
                                    if (errs__7) vErrors.length = errs__7;
                                    else vErrors = null;
                                  }
                                }
                                var valid7 = errors === errs_7;
                              }
                              if (data6.hint !== undefined) {
                                var errs_7 = errors;
                                if (typeof data6.hint !== "string") {
                                  var err = {
                                    keyword: 'type',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/hint',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/hint/type',
                                    params: {
                                      type: 'string'
                                    },
                                    message: 'should be string'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                }
                                var valid7 = errors === errs_7;
                              }
                              var data7 = data6.pattern;
                              if (data7 !== undefined) {
                                var errs_7 = errors;
                                if (Array.isArray(data7)) {
                                  if (data7.length < 2) {
                                    var err = {
                                      keyword: 'minItems',
                                      dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/pattern',
                                      schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/pattern/minItems',
                                      params: {
                                        limit: 2
                                      },
                                      message: 'should NOT have fewer than 2 items'
                                    };
                                    if (vErrors === null) vErrors = [err];
                                    else vErrors.push(err);
                                    errors++;
                                  }
                                  var errs__7 = errors;
                                  var valid7;
                                  valid8 = true;
                                  if (data7.length > 0) {
                                    var data8 = data7[0];
                                    var errs_8 = errors;
                                    var errs__8 = errors,
                                      prevValid8 = false,
                                      valid8 = false,
                                      passingSchemas8 = null;
                                    var errs_9 = errors;
                                    if (typeof data8 !== "string") {
                                      var err = {
                                        keyword: 'type',
                                        dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/pattern/' + 0,
                                        schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/pattern/items/0/oneOf/0/type',
                                        params: {
                                          type: 'string'
                                        },
                                        message: 'should be string'
                                      };
                                      if (vErrors === null) vErrors = [err];
                                      else vErrors.push(err);
                                      errors++;
                                    }
                                    var valid9 = errors === errs_9;
                                    if (valid9) {
                                      valid8 = prevValid8 = true;
                                      passingSchemas8 = 0;
                                    }
                                    var errs_9 = errors;
                                    customRule0.errors = null;
                                    var errs__9 = errors;
                                    var valid9;
                                    customRule0.errors = null;
                                    valid9 = customRule0.call(self, data8, (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/pattern/' + 0, data7, 0, rootData);
                                    if (!valid9) {
                                      if (Array.isArray(customRule0.errors)) {
                                        if (vErrors === null) vErrors = customRule0.errors;
                                        else vErrors = vErrors.concat(customRule0.errors);
                                        errors = vErrors.length;
                                        for (var i9 = errs__9; i9 < errors; i9++) {
                                          var ruleErr9 = vErrors[i9];
                                          if (ruleErr9.dataPath === undefined) ruleErr9.dataPath = (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/pattern/' + 0;
                                          ruleErr9.schemaPath = "#/properties/collections/items/properties/files/items/properties/fields/items/properties/pattern/items/0/oneOf/1/instanceof";
                                        }
                                      } else {
                                        var err = {
                                          keyword: 'instanceof',
                                          dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/pattern/' + 0,
                                          schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/pattern/items/0/oneOf/1/instanceof',
                                          params: {
                                            keyword: 'instanceof'
                                          },
                                          message: 'should pass "instanceof" keyword validation'
                                        };
                                        if (vErrors === null) vErrors = [err];
                                        else vErrors.push(err);
                                        errors++;
                                      }
                                    }
                                    var valid9 = errors === errs_9;
                                    if (valid9 && prevValid8) {
                                      valid8 = false;
                                      passingSchemas8 = [passingSchemas8, 1];
                                    } else {
                                      if (valid9) {
                                        valid8 = prevValid8 = true;
                                        passingSchemas8 = 1;
                                      }
                                    }
                                    if (!valid8) {
                                      var err = {
                                        keyword: 'oneOf',
                                        dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/pattern/' + 0,
                                        schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/pattern/items/0/oneOf',
                                        params: {
                                          passingSchemas: passingSchemas8
                                        },
                                        message: 'should match exactly one schema in oneOf'
                                      };
                                      if (vErrors === null) vErrors = [err];
                                      else vErrors.push(err);
                                      errors++;
                                    } else {
                                      errors = errs__8;
                                      if (vErrors !== null) {
                                        if (errs__8) vErrors.length = errs__8;
                                        else vErrors = null;
                                      }
                                    }
                                    var valid8 = errors === errs_8;
                                  }
                                  valid8 = true;
                                  if (data7.length > 1) {
                                    var errs_8 = errors;
                                    if (typeof data7[1] !== "string") {
                                      var err = {
                                        keyword: 'type',
                                        dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/pattern/' + 1,
                                        schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/pattern/items/1/type',
                                        params: {
                                          type: 'string'
                                        },
                                        message: 'should be string'
                                      };
                                      if (vErrors === null) vErrors = [err];
                                      else vErrors.push(err);
                                      errors++;
                                    }
                                    var valid8 = errors === errs_8;
                                  }
                                } else {
                                  var err = {
                                    keyword: 'type',
                                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/pattern',
                                    schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/properties/pattern/type',
                                    params: {
                                      type: 'array'
                                    },
                                    message: 'should be array'
                                  };
                                  if (vErrors === null) vErrors = [err];
                                  else vErrors.push(err);
                                  errors++;
                                }
                                var valid7 = errors === errs_7;
                              }
                              if (data6.field !== undefined) {
                                var errs_7 = errors;
                                if (!refVal1(data6.field, (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/field', data6, 'field', rootData)) {
                                  if (vErrors === null) vErrors = refVal1.errors;
                                  else vErrors = vErrors.concat(refVal1.errors);
                                  errors = vErrors.length;
                                }
                                var valid7 = errors === errs_7;
                              }
                              if (data6.fields !== undefined) {
                                var errs_7 = errors;
                                if (!refVal[2](data6.fields, (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/fields', data6, 'fields', rootData)) {
                                  if (vErrors === null) vErrors = refVal[2].errors;
                                  else vErrors = vErrors.concat(refVal[2].errors);
                                  errors = vErrors.length;
                                }
                                var valid7 = errors === errs_7;
                              }
                              if (data6.types !== undefined) {
                                var errs_7 = errors;
                                if (!refVal[2](data6.types, (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5 + '/types', data6, 'types', rootData)) {
                                  if (vErrors === null) vErrors = refVal[2].errors;
                                  else vErrors = vErrors.concat(refVal[2].errors);
                                  errors = vErrors.length;
                                }
                                var valid7 = errors === errs_7;
                              }
                            } else {
                              var err = {
                                keyword: 'type',
                                dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5,
                                schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/type',
                                params: {
                                  type: 'object'
                                },
                                message: 'should be object'
                              };
                              if (vErrors === null) vErrors = [err];
                              else vErrors.push(err);
                              errors++;
                            }
                            var schema6 = data6 && data6.widget;
                            var definition6 = RULES.custom['select'].definition;
                            var keywordValidate6 = definition6.validate;
                            keywordValidate6.errors = null;
                            var errs__6 = errors;
                            var valid6;
                            if (schema6 === undefined) {
                              valid6 = true;
                            } else {
                              valid6 = definition6.validateSchema(schema6);
                              if (valid6) {
                                keywordValidate6.errors = null;
                                valid6 = keywordValidate6.call(self, schema6, data6, validate.schema.properties.collections.items.properties.files.items.properties.fields.items, (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5, data5, i5, rootData);
                              }
                            }
                            if (!valid6) {
                              if (Array.isArray(keywordValidate6.errors)) {
                                if (vErrors === null) vErrors = keywordValidate6.errors;
                                else vErrors = vErrors.concat(keywordValidate6.errors);
                                errors = vErrors.length;
                                for (var i6 = errs__6; i6 < errors; i6++) {
                                  var ruleErr6 = vErrors[i6];
                                  if (ruleErr6.dataPath === undefined) ruleErr6.dataPath = (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5;
                                  ruleErr6.schemaPath = "#/properties/collections/items/properties/files/items/properties/fields/items/select";
                                }
                              } else {
                                var err = {
                                  keyword: 'select',
                                  dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5,
                                  schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/items/select',
                                  params: {
                                    keyword: 'select'
                                  },
                                  message: 'should pass "select" keyword validation'
                                };
                                if (vErrors === null) vErrors = [err];
                                else vErrors.push(err);
                                errors++;
                              }
                            }
                            customRule6.errors = null;
                            var errs__6 = errors;
                            var valid6;
                            customRule6.errors = null;
                            valid6 = customRule6.call(self, data6, (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields/' + i5, data5, i5, rootData);
                            var valid6 = errors === errs_6;
                          }
                          customRule7.errors = null;
                          var errs__5 = errors;
                          var valid5;
                          customRule7.errors = null;
                          valid5 = customRule7.call(self, data5, (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields', data4, 'fields', rootData);
                          if (!valid5) {
                            if (Array.isArray(customRule7.errors)) {
                              if (vErrors === null) vErrors = customRule7.errors;
                              else vErrors = vErrors.concat(customRule7.errors);
                              errors = vErrors.length;
                              for (var i5 = errs__5; i5 < errors; i5++) {
                                var ruleErr5 = vErrors[i5];
                                if (ruleErr5.dataPath === undefined) ruleErr5.dataPath = (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields';
                                ruleErr5.schemaPath = "#/properties/collections/items/properties/files/items/properties/fields/uniqueItemProperties";
                              }
                            } else {
                              var err = {
                                keyword: 'uniqueItemProperties',
                                dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields',
                                schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/uniqueItemProperties',
                                params: {
                                  keyword: 'uniqueItemProperties'
                                },
                                message: 'should pass "uniqueItemProperties" keyword validation'
                              };
                              if (vErrors === null) vErrors = [err];
                              else vErrors.push(err);
                              errors++;
                            }
                          }
                        } else {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3 + '/fields',
                            schemaPath: '#/properties/collections/items/properties/files/items/properties/fields/type',
                            params: {
                              type: 'array'
                            },
                            message: 'should be array'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                    } else {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/files/' + i3,
                        schemaPath: '#/properties/collections/items/properties/files/items/type',
                        params: {
                          type: 'object'
                        },
                        message: 'should be object'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                  customRule8.errors = null;
                  var errs__3 = errors;
                  var valid3;
                  customRule8.errors = null;
                  valid3 = customRule8.call(self, data3, (dataPath || '') + '/collections/' + i1 + '/files', data2, 'files', rootData);
                  if (!valid3) {
                    if (Array.isArray(customRule8.errors)) {
                      if (vErrors === null) vErrors = customRule8.errors;
                      else vErrors = vErrors.concat(customRule8.errors);
                      errors = vErrors.length;
                      for (var i3 = errs__3; i3 < errors; i3++) {
                        var ruleErr3 = vErrors[i3];
                        if (ruleErr3.dataPath === undefined) ruleErr3.dataPath = (dataPath || '') + '/collections/' + i1 + '/files';
                        ruleErr3.schemaPath = "#/properties/collections/items/properties/files/uniqueItemProperties";
                      }
                    } else {
                      var err = {
                        keyword: 'uniqueItemProperties',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/files',
                        schemaPath: '#/properties/collections/items/properties/files/uniqueItemProperties',
                        params: {
                          keyword: 'uniqueItemProperties'
                        },
                        message: 'should pass "uniqueItemProperties" keyword validation'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/files',
                    schemaPath: '#/properties/collections/items/properties/files/type',
                    params: {
                      type: 'array'
                    },
                    message: 'should be array'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.identifier_field !== undefined) {
                var errs_3 = errors;
                if (typeof data2.identifier_field !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/identifier_field',
                    schemaPath: '#/properties/collections/items/properties/identifier_field/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.summary !== undefined) {
                var errs_3 = errors;
                if (typeof data2.summary !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/summary',
                    schemaPath: '#/properties/collections/items/properties/summary/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.slug !== undefined) {
                var errs_3 = errors;
                if (typeof data2.slug !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/slug',
                    schemaPath: '#/properties/collections/items/properties/slug/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.path !== undefined) {
                var errs_3 = errors;
                if (typeof data2.path !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/path',
                    schemaPath: '#/properties/collections/items/properties/path/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.preview_path !== undefined) {
                var errs_3 = errors;
                if (typeof data2.preview_path !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/preview_path',
                    schemaPath: '#/properties/collections/items/properties/preview_path/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.preview_path_date_field !== undefined) {
                var errs_3 = errors;
                if (typeof data2.preview_path_date_field !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/preview_path_date_field',
                    schemaPath: '#/properties/collections/items/properties/preview_path_date_field/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.create !== undefined) {
                var errs_3 = errors;
                if (typeof data2.create !== "boolean") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/create',
                    schemaPath: '#/properties/collections/items/properties/create/type',
                    params: {
                      type: 'boolean'
                    },
                    message: 'should be boolean'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.publish !== undefined) {
                var errs_3 = errors;
                if (typeof data2.publish !== "boolean") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/publish',
                    schemaPath: '#/properties/collections/items/properties/publish/type',
                    params: {
                      type: 'boolean'
                    },
                    message: 'should be boolean'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.hide !== undefined) {
                var errs_3 = errors;
                if (typeof data2.hide !== "boolean") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/hide',
                    schemaPath: '#/properties/collections/items/properties/hide/type',
                    params: {
                      type: 'boolean'
                    },
                    message: 'should be boolean'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.editor;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if ((data3 && typeof data3 === "object" && !Array.isArray(data3))) {
                  var errs__3 = errors;
                  var valid4 = true;
                  if (data3.preview !== undefined) {
                    var errs_4 = errors;
                    if (typeof data3.preview !== "boolean") {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/editor/preview',
                        schemaPath: '#/properties/collections/items/properties/editor/properties/preview/type',
                        params: {
                          type: 'boolean'
                        },
                        message: 'should be boolean'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/editor',
                    schemaPath: '#/properties/collections/items/properties/editor/type',
                    params: {
                      type: 'object'
                    },
                    message: 'should be object'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.format;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if (typeof data3 !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/format',
                    schemaPath: '#/properties/collections/items/properties/format/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var schema3 = validate.schema.properties.collections.items.properties.format.enum;
                var valid3;
                valid3 = false;
                for (var i3 = 0; i3 < schema3.length; i3++)
                  if (equal(data3, schema3[i3])) {
                    valid3 = true;
                    break;
                  } if (!valid3) {
                  var err = {
                    keyword: 'enum',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/format',
                    schemaPath: '#/properties/collections/items/properties/format/enum',
                    params: {
                      allowedValues: schema3
                    },
                    message: 'should be equal to one of the allowed values'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              if (data2.extension !== undefined) {
                var errs_3 = errors;
                if (typeof data2.extension !== "string") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/extension',
                    schemaPath: '#/properties/collections/items/properties/extension/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.frontmatter_delimiter;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if (typeof data3 !== "string" && !Array.isArray(data3)) {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/frontmatter_delimiter',
                    schemaPath: '#/properties/collections/items/properties/frontmatter_delimiter/type',
                    params: {
                      type: 'string,array'
                    },
                    message: 'should be string,array'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                if (Array.isArray(data3)) {
                  if (data3.length > 2) {
                    var err = {
                      keyword: 'maxItems',
                      dataPath: (dataPath || '') + '/collections/' + i1 + '/frontmatter_delimiter',
                      schemaPath: '#/properties/collections/items/properties/frontmatter_delimiter/maxItems',
                      params: {
                        limit: 2
                      },
                      message: 'should NOT have more than 2 items'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  if (data3.length < 2) {
                    var err = {
                      keyword: 'minItems',
                      dataPath: (dataPath || '') + '/collections/' + i1 + '/frontmatter_delimiter',
                      schemaPath: '#/properties/collections/items/properties/frontmatter_delimiter/minItems',
                      params: {
                        limit: 2
                      },
                      message: 'should NOT have fewer than 2 items'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var errs__3 = errors;
                  var valid3;
                  for (var i3 = 0; i3 < data3.length; i3++) {
                    var errs_4 = errors;
                    if (typeof data3[i3] !== "string") {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/frontmatter_delimiter/' + i3,
                        schemaPath: '#/properties/collections/items/properties/frontmatter_delimiter/items/type',
                        params: {
                          type: 'string'
                        },
                        message: 'should be string'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.fields;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if (Array.isArray(data3)) {
                  if (data3.length < 1) {
                    var err = {
                      keyword: 'minItems',
                      dataPath: (dataPath || '') + '/collections/' + i1 + '/fields',
                      schemaPath: '#/properties/collections/items/properties/fields/minItems',
                      params: {
                        limit: 1
                      },
                      message: 'should NOT have fewer than 1 items'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var errs__3 = errors;
                  var valid3;
                  for (var i3 = 0; i3 < data3.length; i3++) {
                    var data4 = data3[i3];
                    var errs_4 = errors;
                    if ((data4 && typeof data4 === "object" && !Array.isArray(data4))) {
                      var errs__4 = errors;
                      var valid5 = true;
                      if (data4.name === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3,
                          schemaPath: '#/properties/collections/items/properties/fields/items/required',
                          params: {
                            missingProperty: 'name'
                          },
                          message: 'should have required property \'name\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.name !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/name',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/name/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.label !== undefined) {
                        var errs_5 = errors;
                        if (typeof data4.label !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/label',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/label/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.widget !== undefined) {
                        var errs_5 = errors;
                        if (typeof data4.widget !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/widget',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/widget/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.required !== undefined) {
                        var errs_5 = errors;
                        if (typeof data4.required !== "boolean") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/required',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/required/type',
                            params: {
                              type: 'boolean'
                            },
                            message: 'should be boolean'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      var data5 = data4.i18n;
                      if (data5 !== undefined) {
                        var errs_5 = errors;
                        var errs__5 = errors,
                          prevValid5 = false,
                          valid5 = false,
                          passingSchemas5 = null;
                        var errs_6 = errors;
                        if (typeof data5 !== "boolean") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/i18n',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/i18n/oneOf/0/type',
                            params: {
                              type: 'boolean'
                            },
                            message: 'should be boolean'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid6 = errors === errs_6;
                        if (valid6) {
                          valid5 = prevValid5 = true;
                          passingSchemas5 = 0;
                        }
                        var errs_6 = errors;
                        if (typeof data5 !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/i18n',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/i18n/oneOf/1/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var schema6 = validate.schema.properties.collections.items.properties.fields.items.properties.i18n.oneOf[1].enum;
                        var valid6;
                        valid6 = false;
                        for (var i6 = 0; i6 < schema6.length; i6++)
                          if (equal(data5, schema6[i6])) {
                            valid6 = true;
                            break;
                          } if (!valid6) {
                          var err = {
                            keyword: 'enum',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/i18n',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/i18n/oneOf/1/enum',
                            params: {
                              allowedValues: schema6
                            },
                            message: 'should be equal to one of the allowed values'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid6 = errors === errs_6;
                        if (valid6 && prevValid5) {
                          valid5 = false;
                          passingSchemas5 = [passingSchemas5, 1];
                        } else {
                          if (valid6) {
                            valid5 = prevValid5 = true;
                            passingSchemas5 = 1;
                          }
                        }
                        if (!valid5) {
                          var err = {
                            keyword: 'oneOf',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/i18n',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/i18n/oneOf',
                            params: {
                              passingSchemas: passingSchemas5
                            },
                            message: 'should match exactly one schema in oneOf'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        } else {
                          errors = errs__5;
                          if (vErrors !== null) {
                            if (errs__5) vErrors.length = errs__5;
                            else vErrors = null;
                          }
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.hint !== undefined) {
                        var errs_5 = errors;
                        if (typeof data4.hint !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/hint',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/hint/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      var data5 = data4.pattern;
                      if (data5 !== undefined) {
                        var errs_5 = errors;
                        if (Array.isArray(data5)) {
                          if (data5.length < 2) {
                            var err = {
                              keyword: 'minItems',
                              dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/pattern',
                              schemaPath: '#/properties/collections/items/properties/fields/items/properties/pattern/minItems',
                              params: {
                                limit: 2
                              },
                              message: 'should NOT have fewer than 2 items'
                            };
                            if (vErrors === null) vErrors = [err];
                            else vErrors.push(err);
                            errors++;
                          }
                          var errs__5 = errors;
                          var valid5;
                          valid6 = true;
                          if (data5.length > 0) {
                            var data6 = data5[0];
                            var errs_6 = errors;
                            var errs__6 = errors,
                              prevValid6 = false,
                              valid6 = false,
                              passingSchemas6 = null;
                            var errs_7 = errors;
                            if (typeof data6 !== "string") {
                              var err = {
                                keyword: 'type',
                                dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/pattern/' + 0,
                                schemaPath: '#/properties/collections/items/properties/fields/items/properties/pattern/items/0/oneOf/0/type',
                                params: {
                                  type: 'string'
                                },
                                message: 'should be string'
                              };
                              if (vErrors === null) vErrors = [err];
                              else vErrors.push(err);
                              errors++;
                            }
                            var valid7 = errors === errs_7;
                            if (valid7) {
                              valid6 = prevValid6 = true;
                              passingSchemas6 = 0;
                            }
                            var errs_7 = errors;
                            customRule9.errors = null;
                            var errs__7 = errors;
                            var valid7;
                            customRule9.errors = null;
                            valid7 = customRule9.call(self, data6, (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/pattern/' + 0, data5, 0, rootData);
                            if (!valid7) {
                              if (Array.isArray(customRule9.errors)) {
                                if (vErrors === null) vErrors = customRule9.errors;
                                else vErrors = vErrors.concat(customRule9.errors);
                                errors = vErrors.length;
                                for (var i7 = errs__7; i7 < errors; i7++) {
                                  var ruleErr7 = vErrors[i7];
                                  if (ruleErr7.dataPath === undefined) ruleErr7.dataPath = (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/pattern/' + 0;
                                  ruleErr7.schemaPath = "#/properties/collections/items/properties/fields/items/properties/pattern/items/0/oneOf/1/instanceof";
                                }
                              } else {
                                var err = {
                                  keyword: 'instanceof',
                                  dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/pattern/' + 0,
                                  schemaPath: '#/properties/collections/items/properties/fields/items/properties/pattern/items/0/oneOf/1/instanceof',
                                  params: {
                                    keyword: 'instanceof'
                                  },
                                  message: 'should pass "instanceof" keyword validation'
                                };
                                if (vErrors === null) vErrors = [err];
                                else vErrors.push(err);
                                errors++;
                              }
                            }
                            var valid7 = errors === errs_7;
                            if (valid7 && prevValid6) {
                              valid6 = false;
                              passingSchemas6 = [passingSchemas6, 1];
                            } else {
                              if (valid7) {
                                valid6 = prevValid6 = true;
                                passingSchemas6 = 1;
                              }
                            }
                            if (!valid6) {
                              var err = {
                                keyword: 'oneOf',
                                dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/pattern/' + 0,
                                schemaPath: '#/properties/collections/items/properties/fields/items/properties/pattern/items/0/oneOf',
                                params: {
                                  passingSchemas: passingSchemas6
                                },
                                message: 'should match exactly one schema in oneOf'
                              };
                              if (vErrors === null) vErrors = [err];
                              else vErrors.push(err);
                              errors++;
                            } else {
                              errors = errs__6;
                              if (vErrors !== null) {
                                if (errs__6) vErrors.length = errs__6;
                                else vErrors = null;
                              }
                            }
                            var valid6 = errors === errs_6;
                          }
                          valid6 = true;
                          if (data5.length > 1) {
                            var errs_6 = errors;
                            if (typeof data5[1] !== "string") {
                              var err = {
                                keyword: 'type',
                                dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/pattern/' + 1,
                                schemaPath: '#/properties/collections/items/properties/fields/items/properties/pattern/items/1/type',
                                params: {
                                  type: 'string'
                                },
                                message: 'should be string'
                              };
                              if (vErrors === null) vErrors = [err];
                              else vErrors.push(err);
                              errors++;
                            }
                            var valid6 = errors === errs_6;
                          }
                        } else {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/pattern',
                            schemaPath: '#/properties/collections/items/properties/fields/items/properties/pattern/type',
                            params: {
                              type: 'array'
                            },
                            message: 'should be array'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.field !== undefined) {
                        var errs_5 = errors;
                        if (!refVal3(data4.field, (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/field', data4, 'field', rootData)) {
                          if (vErrors === null) vErrors = refVal3.errors;
                          else vErrors = vErrors.concat(refVal3.errors);
                          errors = vErrors.length;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.fields !== undefined) {
                        var errs_5 = errors;
                        if (!refVal[4](data4.fields, (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/fields', data4, 'fields', rootData)) {
                          if (vErrors === null) vErrors = refVal[4].errors;
                          else vErrors = vErrors.concat(refVal[4].errors);
                          errors = vErrors.length;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.types !== undefined) {
                        var errs_5 = errors;
                        if (!refVal[4](data4.types, (dataPath || '') + '/collections/' + i1 + '/fields/' + i3 + '/types', data4, 'types', rootData)) {
                          if (vErrors === null) vErrors = refVal[4].errors;
                          else vErrors = vErrors.concat(refVal[4].errors);
                          errors = vErrors.length;
                        }
                        var valid5 = errors === errs_5;
                      }
                    } else {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3,
                        schemaPath: '#/properties/collections/items/properties/fields/items/type',
                        params: {
                          type: 'object'
                        },
                        message: 'should be object'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var schema4 = data4 && data4.widget;
                    var definition4 = RULES.custom['select'].definition;
                    var keywordValidate4 = definition4.validate;
                    keywordValidate4.errors = null;
                    var errs__4 = errors;
                    var valid4;
                    if (schema4 === undefined) {
                      valid4 = true;
                    } else {
                      valid4 = definition4.validateSchema(schema4);
                      if (valid4) {
                        keywordValidate4.errors = null;
                        valid4 = keywordValidate4.call(self, schema4, data4, validate.schema.properties.collections.items.properties.fields.items, (dataPath || '') + '/collections/' + i1 + '/fields/' + i3, data3, i3, rootData);
                      }
                    }
                    if (!valid4) {
                      if (Array.isArray(keywordValidate4.errors)) {
                        if (vErrors === null) vErrors = keywordValidate4.errors;
                        else vErrors = vErrors.concat(keywordValidate4.errors);
                        errors = vErrors.length;
                        for (var i4 = errs__4; i4 < errors; i4++) {
                          var ruleErr4 = vErrors[i4];
                          if (ruleErr4.dataPath === undefined) ruleErr4.dataPath = (dataPath || '') + '/collections/' + i1 + '/fields/' + i3;
                          ruleErr4.schemaPath = "#/properties/collections/items/properties/fields/items/select";
                        }
                      } else {
                        var err = {
                          keyword: 'select',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/fields/' + i3,
                          schemaPath: '#/properties/collections/items/properties/fields/items/select',
                          params: {
                            keyword: 'select'
                          },
                          message: 'should pass "select" keyword validation'
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      }
                    }
                    customRule15.errors = null;
                    var errs__4 = errors;
                    var valid4;
                    customRule15.errors = null;
                    valid4 = customRule15.call(self, data4, (dataPath || '') + '/collections/' + i1 + '/fields/' + i3, data3, i3, rootData);
                    var valid4 = errors === errs_4;
                  }
                  customRule16.errors = null;
                  var errs__3 = errors;
                  var valid3;
                  customRule16.errors = null;
                  valid3 = customRule16.call(self, data3, (dataPath || '') + '/collections/' + i1 + '/fields', data2, 'fields', rootData);
                  if (!valid3) {
                    if (Array.isArray(customRule16.errors)) {
                      if (vErrors === null) vErrors = customRule16.errors;
                      else vErrors = vErrors.concat(customRule16.errors);
                      errors = vErrors.length;
                      for (var i3 = errs__3; i3 < errors; i3++) {
                        var ruleErr3 = vErrors[i3];
                        if (ruleErr3.dataPath === undefined) ruleErr3.dataPath = (dataPath || '') + '/collections/' + i1 + '/fields';
                        ruleErr3.schemaPath = "#/properties/collections/items/properties/fields/uniqueItemProperties";
                      }
                    } else {
                      var err = {
                        keyword: 'uniqueItemProperties',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/fields',
                        schemaPath: '#/properties/collections/items/properties/fields/uniqueItemProperties',
                        params: {
                          keyword: 'uniqueItemProperties'
                        },
                        message: 'should pass "uniqueItemProperties" keyword validation'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/fields',
                    schemaPath: '#/properties/collections/items/properties/fields/type',
                    params: {
                      type: 'array'
                    },
                    message: 'should be array'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.sortable_fields;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if (Array.isArray(data3)) {
                  var errs__3 = errors;
                  var valid3;
                  for (var i3 = 0; i3 < data3.length; i3++) {
                    var errs_4 = errors;
                    if (typeof data3[i3] !== "string") {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/sortable_fields/' + i3,
                        schemaPath: '#/properties/collections/items/properties/sortable_fields/items/type',
                        params: {
                          type: 'string'
                        },
                        message: 'should be string'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/sortable_fields',
                    schemaPath: '#/properties/collections/items/properties/sortable_fields/type',
                    params: {
                      type: 'array'
                    },
                    message: 'should be array'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.sortableFields;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if (Array.isArray(data3)) {
                  var errs__3 = errors;
                  var valid3;
                  for (var i3 = 0; i3 < data3.length; i3++) {
                    var errs_4 = errors;
                    if (typeof data3[i3] !== "string") {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/sortableFields/' + i3,
                        schemaPath: '#/properties/collections/items/properties/sortableFields/items/type',
                        params: {
                          type: 'string'
                        },
                        message: 'should be string'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/sortableFields',
                    schemaPath: '#/properties/collections/items/properties/sortableFields/type',
                    params: {
                      type: 'array'
                    },
                    message: 'should be array'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.view_filters;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if (Array.isArray(data3)) {
                  if (data3.length < 1) {
                    var err = {
                      keyword: 'minItems',
                      dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters',
                      schemaPath: '#/properties/collections/items/properties/view_filters/minItems',
                      params: {
                        limit: 1
                      },
                      message: 'should NOT have fewer than 1 items'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var errs__3 = errors;
                  var valid3;
                  for (var i3 = 0; i3 < data3.length; i3++) {
                    var data4 = data3[i3];
                    var errs_4 = errors;
                    if ((data4 && typeof data4 === "object" && !Array.isArray(data4))) {
                      var errs__4 = errors;
                      var valid5 = true;
                      for (var key4 in data4) {
                        var isAdditional4 = !(false || key4 == 'label' || key4 == 'field' || key4 == 'pattern');
                        if (isAdditional4) {
                          valid5 = false;
                          var err = {
                            keyword: 'additionalProperties',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3,
                            schemaPath: '#/properties/collections/items/properties/view_filters/items/additionalProperties',
                            params: {
                              additionalProperty: '' + key4 + ''
                            },
                            message: 'should NOT have additional properties'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                      }
                      if (data4.label === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3,
                          schemaPath: '#/properties/collections/items/properties/view_filters/items/required',
                          params: {
                            missingProperty: 'label'
                          },
                          message: 'should have required property \'label\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.label !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3 + '/label',
                            schemaPath: '#/properties/collections/items/properties/view_filters/items/properties/label/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.field === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3,
                          schemaPath: '#/properties/collections/items/properties/view_filters/items/required',
                          params: {
                            missingProperty: 'field'
                          },
                          message: 'should have required property \'field\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.field !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3 + '/field',
                            schemaPath: '#/properties/collections/items/properties/view_filters/items/properties/field/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      var data5 = data4.pattern;
                      if (data5 === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3,
                          schemaPath: '#/properties/collections/items/properties/view_filters/items/required',
                          params: {
                            missingProperty: 'pattern'
                          },
                          message: 'should have required property \'pattern\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        var errs__5 = errors,
                          prevValid5 = false,
                          valid5 = false,
                          passingSchemas5 = null;
                        var errs_6 = errors;
                        if (typeof data5 !== "boolean") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3 + '/pattern',
                            schemaPath: '#/properties/collections/items/properties/view_filters/items/properties/pattern/oneOf/0/type',
                            params: {
                              type: 'boolean'
                            },
                            message: 'should be boolean'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid6 = errors === errs_6;
                        if (valid6) {
                          valid5 = prevValid5 = true;
                          passingSchemas5 = 0;
                        }
                        var errs_6 = errors;
                        if (typeof data5 !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3 + '/pattern',
                            schemaPath: '#/properties/collections/items/properties/view_filters/items/properties/pattern/oneOf/1/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid6 = errors === errs_6;
                        if (valid6 && prevValid5) {
                          valid5 = false;
                          passingSchemas5 = [passingSchemas5, 1];
                        } else {
                          if (valid6) {
                            valid5 = prevValid5 = true;
                            passingSchemas5 = 1;
                          }
                        }
                        if (!valid5) {
                          var err = {
                            keyword: 'oneOf',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3 + '/pattern',
                            schemaPath: '#/properties/collections/items/properties/view_filters/items/properties/pattern/oneOf',
                            params: {
                              passingSchemas: passingSchemas5
                            },
                            message: 'should match exactly one schema in oneOf'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        } else {
                          errors = errs__5;
                          if (vErrors !== null) {
                            if (errs__5) vErrors.length = errs__5;
                            else vErrors = null;
                          }
                        }
                        var valid5 = errors === errs_5;
                      }
                    } else {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters/' + i3,
                        schemaPath: '#/properties/collections/items/properties/view_filters/items/type',
                        params: {
                          type: 'object'
                        },
                        message: 'should be object'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/view_filters',
                    schemaPath: '#/properties/collections/items/properties/view_filters/type',
                    params: {
                      type: 'array'
                    },
                    message: 'should be array'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.view_groups;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if (Array.isArray(data3)) {
                  if (data3.length < 1) {
                    var err = {
                      keyword: 'minItems',
                      dataPath: (dataPath || '') + '/collections/' + i1 + '/view_groups',
                      schemaPath: '#/properties/collections/items/properties/view_groups/minItems',
                      params: {
                        limit: 1
                      },
                      message: 'should NOT have fewer than 1 items'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var errs__3 = errors;
                  var valid3;
                  for (var i3 = 0; i3 < data3.length; i3++) {
                    var data4 = data3[i3];
                    var errs_4 = errors;
                    if ((data4 && typeof data4 === "object" && !Array.isArray(data4))) {
                      var errs__4 = errors;
                      var valid5 = true;
                      for (var key4 in data4) {
                        var isAdditional4 = !(false || key4 == 'label' || key4 == 'field' || key4 == 'pattern');
                        if (isAdditional4) {
                          valid5 = false;
                          var err = {
                            keyword: 'additionalProperties',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_groups/' + i3,
                            schemaPath: '#/properties/collections/items/properties/view_groups/items/additionalProperties',
                            params: {
                              additionalProperty: '' + key4 + ''
                            },
                            message: 'should NOT have additional properties'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                      }
                      if (data4.label === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/view_groups/' + i3,
                          schemaPath: '#/properties/collections/items/properties/view_groups/items/required',
                          params: {
                            missingProperty: 'label'
                          },
                          message: 'should have required property \'label\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.label !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_groups/' + i3 + '/label',
                            schemaPath: '#/properties/collections/items/properties/view_groups/items/properties/label/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.field === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/view_groups/' + i3,
                          schemaPath: '#/properties/collections/items/properties/view_groups/items/required',
                          params: {
                            missingProperty: 'field'
                          },
                          message: 'should have required property \'field\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.field !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_groups/' + i3 + '/field',
                            schemaPath: '#/properties/collections/items/properties/view_groups/items/properties/field/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.pattern !== undefined) {
                        var errs_5 = errors;
                        if (typeof data4.pattern !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/view_groups/' + i3 + '/pattern',
                            schemaPath: '#/properties/collections/items/properties/view_groups/items/properties/pattern/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                    } else {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/view_groups/' + i3,
                        schemaPath: '#/properties/collections/items/properties/view_groups/items/type',
                        params: {
                          type: 'object'
                        },
                        message: 'should be object'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/view_groups',
                    schemaPath: '#/properties/collections/items/properties/view_groups/type',
                    params: {
                      type: 'array'
                    },
                    message: 'should be array'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.nested;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if ((data3 && typeof data3 === "object" && !Array.isArray(data3))) {
                  var errs__3 = errors;
                  var valid4 = true;
                  var data4 = data3.depth;
                  if (data4 === undefined) {
                    valid4 = false;
                    var err = {
                      keyword: 'required',
                      dataPath: (dataPath || '') + '/collections/' + i1 + '/nested',
                      schemaPath: '#/properties/collections/items/properties/nested/required',
                      params: {
                        missingProperty: 'depth'
                      },
                      message: 'should have required property \'depth\''
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  } else {
                    var errs_4 = errors;
                    if ((typeof data4 === "number")) {
                      if (data4 > 1000 || data4 !== data4) {
                        var err = {
                          keyword: 'maximum',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/nested/depth',
                          schemaPath: '#/properties/collections/items/properties/nested/properties/depth/maximum',
                          params: {
                            comparison: '<=',
                            limit: 1000,
                            exclusive: false
                          },
                          message: 'should be <= 1000'
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      }
                      if (data4 < 1 || data4 !== data4) {
                        var err = {
                          keyword: 'minimum',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/nested/depth',
                          schemaPath: '#/properties/collections/items/properties/nested/properties/depth/minimum',
                          params: {
                            comparison: '>=',
                            limit: 1,
                            exclusive: false
                          },
                          message: 'should be >= 1'
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      }
                    } else {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/nested/depth',
                        schemaPath: '#/properties/collections/items/properties/nested/properties/depth/type',
                        params: {
                          type: 'number'
                        },
                        message: 'should be number'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                  if (data3.summary !== undefined) {
                    var errs_4 = errors;
                    if (typeof data3.summary !== "string") {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/nested/summary',
                        schemaPath: '#/properties/collections/items/properties/nested/properties/summary/type',
                        params: {
                          type: 'string'
                        },
                        message: 'should be string'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/nested',
                    schemaPath: '#/properties/collections/items/properties/nested/type',
                    params: {
                      type: 'object'
                    },
                    message: 'should be object'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.meta;
              if (data3 !== undefined) {
                var errs_3 = errors;
                if ((data3 && typeof data3 === "object" && !Array.isArray(data3))) {
                  if (Object.keys(data3).length < 1) {
                    var err = {
                      keyword: 'minProperties',
                      dataPath: (dataPath || '') + '/collections/' + i1 + '/meta',
                      schemaPath: '#/properties/collections/items/properties/meta/minProperties',
                      params: {
                        limit: 1
                      },
                      message: 'should NOT have fewer than 1 properties'
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var errs__3 = errors;
                  var valid4 = true;
                  for (var key3 in data3) {
                    var isAdditional3 = !(false || key3 == 'path');
                    if (isAdditional3) {
                      valid4 = false;
                      var err = {
                        keyword: 'additionalProperties',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/meta',
                        schemaPath: '#/properties/collections/items/properties/meta/additionalProperties',
                        params: {
                          additionalProperty: '' + key3 + ''
                        },
                        message: 'should NOT have additional properties'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                  }
                  var data4 = data3.path;
                  if (data4 !== undefined) {
                    var errs_4 = errors;
                    if ((data4 && typeof data4 === "object" && !Array.isArray(data4))) {
                      var errs__4 = errors;
                      var valid5 = true;
                      if (data4.label === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/meta/path',
                          schemaPath: '#/properties/collections/items/properties/meta/properties/path/required',
                          params: {
                            missingProperty: 'label'
                          },
                          message: 'should have required property \'label\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.label !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/meta/path/label',
                            schemaPath: '#/properties/collections/items/properties/meta/properties/path/properties/label/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.widget === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/meta/path',
                          schemaPath: '#/properties/collections/items/properties/meta/properties/path/required',
                          params: {
                            missingProperty: 'widget'
                          },
                          message: 'should have required property \'widget\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.widget !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/meta/path/widget',
                            schemaPath: '#/properties/collections/items/properties/meta/properties/path/properties/widget/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                      if (data4.index_file === undefined) {
                        valid5 = false;
                        var err = {
                          keyword: 'required',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/meta/path',
                          schemaPath: '#/properties/collections/items/properties/meta/properties/path/required',
                          params: {
                            missingProperty: 'index_file'
                          },
                          message: 'should have required property \'index_file\''
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      } else {
                        var errs_5 = errors;
                        if (typeof data4.index_file !== "string") {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/meta/path/index_file',
                            schemaPath: '#/properties/collections/items/properties/meta/properties/path/properties/index_file/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid5 = errors === errs_5;
                      }
                    } else {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/meta/path',
                        schemaPath: '#/properties/collections/items/properties/meta/properties/path/type',
                        params: {
                          type: 'object'
                        },
                        message: 'should be object'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid4 = errors === errs_4;
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/meta',
                    schemaPath: '#/properties/collections/items/properties/meta/type',
                    params: {
                      type: 'object'
                    },
                    message: 'should be object'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid3 = errors === errs_3;
              }
              var data3 = data2.i18n;
              if (data3 !== undefined) {
                var errs_3 = errors;
                var errs__3 = errors,
                  prevValid3 = false,
                  valid3 = false,
                  passingSchemas3 = null;
                var errs_4 = errors;
                if (typeof data3 !== "boolean") {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n',
                    schemaPath: '#/properties/collections/items/properties/i18n/oneOf/0/type',
                    params: {
                      type: 'boolean'
                    },
                    message: 'should be boolean'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid4 = errors === errs_4;
                if (valid4) {
                  valid3 = prevValid3 = true;
                  passingSchemas3 = 0;
                }
                var errs_4 = errors;
                if ((data3 && typeof data3 === "object" && !Array.isArray(data3))) {
                  var errs__4 = errors;
                  var valid5 = true;
                  var data4 = data3.structure;
                  if (data4 !== undefined) {
                    var errs_5 = errors;
                    if (typeof data4 !== "string") {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/structure',
                        schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/structure/type',
                        params: {
                          type: 'string'
                        },
                        message: 'should be string'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var schema5 = validate.schema.properties.collections.items.properties.i18n.oneOf[1].properties.structure.enum;
                    var valid5;
                    valid5 = false;
                    for (var i5 = 0; i5 < schema5.length; i5++)
                      if (equal(data4, schema5[i5])) {
                        valid5 = true;
                        break;
                      } if (!valid5) {
                      var err = {
                        keyword: 'enum',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/structure',
                        schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/structure/enum',
                        params: {
                          allowedValues: schema5
                        },
                        message: 'should be equal to one of the allowed values'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid5 = errors === errs_5;
                  }
                  var data4 = data3.locales;
                  if (data4 !== undefined) {
                    var errs_5 = errors;
                    if (Array.isArray(data4)) {
                      if (data4.length < 2) {
                        var err = {
                          keyword: 'minItems',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/locales',
                          schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/locales/minItems',
                          params: {
                            limit: 2
                          },
                          message: 'should NOT have fewer than 2 items'
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      }
                      var errs__5 = errors;
                      var valid5;
                      for (var i5 = 0; i5 < data4.length; i5++) {
                        var data5 = data4[i5];
                        var errs_6 = errors;
                        if (typeof data5 === "string") {
                          if (ucs2length(data5) > 10) {
                            var err = {
                              keyword: 'maxLength',
                              dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/locales/' + i5,
                              schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/locales/items/maxLength',
                              params: {
                                limit: 10
                              },
                              message: 'should NOT be longer than 10 characters'
                            };
                            if (vErrors === null) vErrors = [err];
                            else vErrors.push(err);
                            errors++;
                          }
                          if (ucs2length(data5) < 2) {
                            var err = {
                              keyword: 'minLength',
                              dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/locales/' + i5,
                              schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/locales/items/minLength',
                              params: {
                                limit: 2
                              },
                              message: 'should NOT be shorter than 2 characters'
                            };
                            if (vErrors === null) vErrors = [err];
                            else vErrors.push(err);
                            errors++;
                          }
                          if (!pattern0.test(data5)) {
                            var err = {
                              keyword: 'pattern',
                              dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/locales/' + i5,
                              schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/locales/items/pattern',
                              params: {
                                pattern: '^[a-zA-Z-_]+$'
                              },
                              message: 'should match pattern "^[a-zA-Z-_]+$"'
                            };
                            if (vErrors === null) vErrors = [err];
                            else vErrors.push(err);
                            errors++;
                          }
                        } else {
                          var err = {
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/locales/' + i5,
                            schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/locales/items/type',
                            params: {
                              type: 'string'
                            },
                            message: 'should be string'
                          };
                          if (vErrors === null) vErrors = [err];
                          else vErrors.push(err);
                          errors++;
                        }
                        var valid6 = errors === errs_6;
                      }
                      var i = data4.length,
                        valid5 = true,
                        j;
                      if (i > 1) {
                        var itemIndices = {},
                          item;
                        for (; i--;) {
                          var item = data4[i];
                          if (typeof item !== "string") continue;
                          if (typeof itemIndices[item] == 'number') {
                            valid5 = false;
                            j = itemIndices[item];
                            break;
                          }
                          itemIndices[item] = i;
                        }
                      }
                      if (!valid5) {
                        var err = {
                          keyword: 'uniqueItems',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/locales',
                          schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/locales/uniqueItems',
                          params: {
                            i: i,
                            j: j
                          },
                          message: 'should NOT have duplicate items (items ## ' + j + ' and ' + i + ' are identical)'
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      }
                    } else {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/locales',
                        schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/locales/type',
                        params: {
                          type: 'array'
                        },
                        message: 'should be array'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid5 = errors === errs_5;
                  }
                  var data4 = data3.default_locale;
                  if (data4 !== undefined) {
                    var errs_5 = errors;
                    if (typeof data4 === "string") {
                      if (ucs2length(data4) > 10) {
                        var err = {
                          keyword: 'maxLength',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/default_locale',
                          schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/default_locale/maxLength',
                          params: {
                            limit: 10
                          },
                          message: 'should NOT be longer than 10 characters'
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      }
                      if (ucs2length(data4) < 2) {
                        var err = {
                          keyword: 'minLength',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/default_locale',
                          schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/default_locale/minLength',
                          params: {
                            limit: 2
                          },
                          message: 'should NOT be shorter than 2 characters'
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      }
                      if (!pattern0.test(data4)) {
                        var err = {
                          keyword: 'pattern',
                          dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/default_locale',
                          schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/default_locale/pattern',
                          params: {
                            pattern: '^[a-zA-Z-_]+$'
                          },
                          message: 'should match pattern "^[a-zA-Z-_]+$"'
                        };
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                      }
                    } else {
                      var err = {
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n/default_locale',
                        schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/properties/default_locale/type',
                        params: {
                          type: 'string'
                        },
                        message: 'should be string'
                      };
                      if (vErrors === null) vErrors = [err];
                      else vErrors.push(err);
                      errors++;
                    }
                    var valid5 = errors === errs_5;
                  }
                } else {
                  var err = {
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n',
                    schemaPath: '#/properties/collections/items/properties/i18n/oneOf/1/type',
                    params: {
                      type: 'object'
                    },
                    message: 'should be object'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                }
                var valid4 = errors === errs_4;
                if (valid4 && prevValid3) {
                  valid3 = false;
                  passingSchemas3 = [passingSchemas3, 1];
                } else {
                  if (valid4) {
                    valid3 = prevValid3 = true;
                    passingSchemas3 = 1;
                  }
                }
                if (!valid3) {
                  var err = {
                    keyword: 'oneOf',
                    dataPath: (dataPath || '') + '/collections/' + i1 + '/i18n',
                    schemaPath: '#/properties/collections/items/properties/i18n/oneOf',
                    params: {
                      passingSchemas: passingSchemas3
                    },
                    message: 'should match exactly one schema in oneOf'
                  };
                  if (vErrors === null) vErrors = [err];
                  else vErrors.push(err);
                  errors++;
                } else {
                  errors = errs__3;
                  if (vErrors !== null) {
                    if (errs__3) vErrors.length = errs__3;
                    else vErrors = null;
                  }
                }
                var valid3 = errors === errs_3;
              }
            } else {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/collections/' + i1,
                schemaPath: '#/properties/collections/items/type',
                params: {
                  type: 'object'
                },
                message: 'should be object'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var errs__2 = errors;
            var errs_3 = errors;
            if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
              var missing3;
              if (((data2.sortable_fields === undefined) && (missing3 = 'sortable_fields')) || ((data2.sortableFields === undefined) && (missing3 = 'sortableFields'))) {
                var err = {};
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              } else {}
            }
            if (errors === errs_3) {}
            var valid3 = errors === errs_3;
            if (valid3) {
              var err = {
                keyword: 'not',
                dataPath: (dataPath || '') + '/collections/' + i1,
                schemaPath: '#/properties/collections/items/not',
                params: {},
                message: 'should NOT be valid'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            } else {
              errors = errs__2;
              if (vErrors !== null) {
                if (errs__2) vErrors.length = errs__2;
                else vErrors = null;
              }
            }
            var errs__2 = errors,
              prevValid2 = false,
              valid2 = false,
              passingSchemas2 = null;
            var errs_3 = errors;
            if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
              if (data2.files === undefined) {
                var err = {
                  keyword: 'required',
                  dataPath: (dataPath || '') + '/collections/' + i1,
                  schemaPath: '#/properties/collections/items/oneOf/0/required',
                  params: {
                    missingProperty: 'files'
                  },
                  message: 'should have required property \'files\''
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
            }
            var valid3 = errors === errs_3;
            if (valid3) {
              valid2 = prevValid2 = true;
              passingSchemas2 = 0;
            }
            var errs_3 = errors;
            if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
              if (data2.folder === undefined) {
                var err = {
                  keyword: 'required',
                  dataPath: (dataPath || '') + '/collections/' + i1,
                  schemaPath: '#/properties/collections/items/oneOf/1/required',
                  params: {
                    missingProperty: 'folder'
                  },
                  message: 'should have required property \'folder\''
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              if (data2.fields === undefined) {
                var err = {
                  keyword: 'required',
                  dataPath: (dataPath || '') + '/collections/' + i1,
                  schemaPath: '#/properties/collections/items/oneOf/1/required',
                  params: {
                    missingProperty: 'fields'
                  },
                  message: 'should have required property \'fields\''
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
            }
            var valid3 = errors === errs_3;
            if (valid3 && prevValid2) {
              valid2 = false;
              passingSchemas2 = [passingSchemas2, 1];
            } else {
              if (valid3) {
                valid2 = prevValid2 = true;
                passingSchemas2 = 1;
              }
            }
            if (!valid2) {
              var err = {
                keyword: 'oneOf',
                dataPath: (dataPath || '') + '/collections/' + i1,
                schemaPath: '#/properties/collections/items/oneOf',
                params: {
                  passingSchemas: passingSchemas2
                },
                message: 'should match exactly one schema in oneOf'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            } else {
              errors = errs__2;
              if (vErrors !== null) {
                if (errs__2) vErrors.length = errs__2;
                else vErrors = null;
              }
            }
            var errs__2 = errors;
            var valid2 = true;
            var errs_3 = errors;
            if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
              if (data2.extension === undefined) {
                var err = {};
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
            }
            var valid3 = errors === errs_3;
            errors = errs__2;
            if (vErrors !== null) {
              if (errs__2) vErrors.length = errs__2;
              else vErrors = null;
            }
            if (valid3) {
              var errs_3 = errors;
              var errs__3 = errors;
              var valid3 = true;
              var errs_4 = errors;
              if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
                var errs__4 = errors;
                var valid5 = true;
                if (data2.extension !== undefined) {
                  var errs_5 = errors;
                  var schema5 = validate.schema.properties.collections.items.then.if.properties.extension.enum;
                  var valid5;
                  valid5 = false;
                  for (var i5 = 0; i5 < schema5.length; i5++)
                    if (equal(data2.extension, schema5[i5])) {
                      valid5 = true;
                      break;
                    } if (!valid5) {
                    var err = {};
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                  var valid5 = errors === errs_5;
                }
              }
              var valid4 = errors === errs_4;
              errors = errs__3;
              if (vErrors !== null) {
                if (errs__3) vErrors.length = errs__3;
                else vErrors = null;
              }
              if (!valid4) {
                var errs_4 = errors;
                if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
                  if (data2.format === undefined) {
                    var err = {
                      keyword: 'required',
                      dataPath: (dataPath || '') + '/collections/' + i1,
                      schemaPath: '#/properties/collections/items/then/else/required',
                      params: {
                        missingProperty: 'format'
                      },
                      message: 'should have required property \'format\''
                    };
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                  }
                }
                var valid4 = errors === errs_4;
                valid3 = valid4;
              }
              if (!valid3) {
                var err = {
                  keyword: 'if',
                  dataPath: (dataPath || '') + '/collections/' + i1,
                  schemaPath: '#/properties/collections/items/then/if',
                  params: {
                    failingKeyword: 'else'
                  },
                  message: 'should match "' + 'else' + '" schema'
                };
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
              }
              var valid3 = errors === errs_3;
              valid2 = valid3;
            }
            if (!valid2) {
              var err = {
                keyword: 'if',
                dataPath: (dataPath || '') + '/collections/' + i1,
                schemaPath: '#/properties/collections/items/if',
                params: {
                  failingKeyword: 'then'
                },
                message: 'should match "' + 'then' + '" schema'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
          customRule17.errors = null;
          var errs__1 = errors;
          var valid1;
          customRule17.errors = null;
          valid1 = customRule17.call(self, data1, (dataPath || '') + '/collections', data, 'collections', rootData);
          if (!valid1) {
            if (Array.isArray(customRule17.errors)) {
              if (vErrors === null) vErrors = customRule17.errors;
              else vErrors = vErrors.concat(customRule17.errors);
              errors = vErrors.length;
              for (var i1 = errs__1; i1 < errors; i1++) {
                var ruleErr1 = vErrors[i1];
                if (ruleErr1.dataPath === undefined) ruleErr1.dataPath = (dataPath || '') + '/collections';
                ruleErr1.schemaPath = "#/properties/collections/uniqueItemProperties";
              }
            } else {
              var err = {
                keyword: 'uniqueItemProperties',
                dataPath: (dataPath || '') + '/collections',
                schemaPath: '#/properties/collections/uniqueItemProperties',
                params: {
                  keyword: 'uniqueItemProperties'
                },
                message: 'should pass "uniqueItemProperties" keyword validation'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
          }
        } else {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/collections',
            schemaPath: '#/properties/collections/type',
            params: {
              type: 'array'
            },
            message: 'should be array'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
      var data1 = data.editor;
      if (data1 !== undefined) {
        var errs_1 = errors;
        if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
          var errs__1 = errors;
          var valid2 = true;
          if (data1.preview !== undefined) {
            var errs_2 = errors;
            if (typeof data1.preview !== "boolean") {
              var err = {
                keyword: 'type',
                dataPath: (dataPath || '') + '/editor/preview',
                schemaPath: '#/properties/editor/properties/preview/type',
                params: {
                  type: 'boolean'
                },
                message: 'should be boolean'
              };
              if (vErrors === null) vErrors = [err];
              else vErrors.push(err);
              errors++;
            }
            var valid2 = errors === errs_2;
          }
        } else {
          var err = {
            keyword: 'type',
            dataPath: (dataPath || '') + '/editor',
            schemaPath: '#/properties/editor/type',
            params: {
              type: 'object'
            },
            message: 'should be object'
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
        var valid1 = errors === errs_1;
      }
    } else {
      var err = {
        keyword: 'type',
        dataPath: (dataPath || '') + "",
        schemaPath: '#/type',
        params: {
          type: 'object'
        },
        message: 'should be object'
      };
      if (vErrors === null) vErrors = [err];
      else vErrors.push(err);
      errors++;
    }
    var errs__0 = errors;
    var valid0 = false;
    var errs_1 = errors;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      if (data.media_folder === undefined) {
        var err = {
          keyword: 'required',
          dataPath: (dataPath || '') + "",
          schemaPath: '#/anyOf/0/required',
          params: {
            missingProperty: 'media_folder'
          },
          message: 'should have required property \'media_folder\''
        };
        if (vErrors === null) vErrors = [err];
        else vErrors.push(err);
        errors++;
      }
    }
    var valid1 = errors === errs_1;
    valid0 = valid0 || valid1;
    if (!valid0) {
      var errs_1 = errors;
      if ((data && typeof data === "object" && !Array.isArray(data))) {
        if (data.media_library === undefined) {
          var err = {
            keyword: 'required',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/anyOf/1/required',
            params: {
              missingProperty: 'media_library'
            },
            message: 'should have required property \'media_library\''
          };
          if (vErrors === null) vErrors = [err];
          else vErrors.push(err);
          errors++;
        }
      }
      var valid1 = errors === errs_1;
      valid0 = valid0 || valid1;
      if (!valid0) {}
    }
    if (!valid0) {
      var err = {
        keyword: 'anyOf',
        dataPath: (dataPath || '') + "",
        schemaPath: '#/anyOf',
        params: {},
        message: 'should match some schema in anyOf'
      };
      if (vErrors === null) vErrors = [err];
      else vErrors.push(err);
      errors++;
    } else {
      errors = errs__0;
      if (vErrors !== null) {
        if (errs__0) vErrors.length = errs__0;
        else vErrors = null;
      }
    }
    validate.errors = vErrors;
    return errors === 0;
  };
})();
validate.schema = {
  "$id": "https://netlify-cms/object.json",
  "type": "object",
  "properties": {
    "backend": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "examples": ["test-repo"]
        },
        "auth_scope": {
          "type": "string",
          "examples": ["repo", "public_repo"],
          "enum": ["repo", "public_repo"]
        },
        "cms_label_prefix": {
          "type": "string",
          "minLength": 1
        },
        "open_authoring": {
          "type": "boolean",
          "examples": [true]
        }
      },
      "required": ["name"]
    },
    "local_backend": {
      "oneOf": [{
        "type": "boolean"
      }, {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "examples": ["http://localhost:8081/api/v1"]
          },
          "allowed_hosts": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "additionalProperties": false
      }]
    },
    "locale": {
      "type": "string",
      "examples": ["en", "fr", "de"]
    },
    "i18n": {
      "type": "object",
      "properties": {
        "structure": {
          "type": "string",
          "enum": ["multiple_folders", "multiple_files", "single_file"]
        },
        "locales": {
          "type": "array",
          "minItems": 2,
          "items": {
            "type": "string",
            "minLength": 2,
            "maxLength": 10,
            "pattern": "^[a-zA-Z-_]+$"
          },
          "uniqueItems": true
        },
        "default_locale": {
          "type": "string",
          "minLength": 2,
          "maxLength": 10,
          "pattern": "^[a-zA-Z-_]+$"
        }
      },
      "required": ["structure", "locales"]
    },
    "site_url": {
      "type": "string",
      "examples": ["https://example.com"]
    },
    "display_url": {
      "type": "string",
      "examples": ["https://example.com"]
    },
    "logo_url": {
      "type": "string",
      "examples": ["https://example.com/images/logo.svg"]
    },
    "show_preview_links": {
      "type": "boolean"
    },
    "media_folder": {
      "type": "string",
      "examples": ["assets/uploads"]
    },
    "public_folder": {
      "type": "string",
      "examples": ["/uploads"]
    },
    "media_folder_relative": {
      "type": "boolean"
    },
    "media_library": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "examples": ["uploadcare"]
        },
        "config": {
          "type": "object"
        }
      },
      "required": ["name"]
    },
    "publish_mode": {
      "type": "string",
      "enum": ["simple", "editorial_workflow"],
      "examples": ["editorial_workflow"]
    },
    "slug": {
      "type": "object",
      "properties": {
        "encoding": {
          "type": "string",
          "enum": ["unicode", "ascii"]
        },
        "clean_accents": {
          "type": "boolean"
        }
      }
    },
    "collections": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "label": {
            "type": "string"
          },
          "label_singular": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "folder": {
            "type": "string"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "label": {
                  "type": "string"
                },
                "label_singular": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                },
                "file": {
                  "type": "string"
                },
                "preview_path": {
                  "type": "string"
                },
                "preview_path_date_field": {
                  "type": "string"
                },
                "fields": {
                  "$id": "fields_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d",
                  "type": "array",
                  "minItems": 1,
                  "items": {
                    "$id": "field_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d",
                    "type": "object",
                    "properties": {
                      "name": {
                        "type": "string"
                      },
                      "label": {
                        "type": "string"
                      },
                      "widget": {
                        "type": "string"
                      },
                      "required": {
                        "type": "boolean"
                      },
                      "i18n": {
                        "oneOf": [{
                          "type": "boolean"
                        }, {
                          "type": "string",
                          "enum": ["translate", "duplicate", "none"]
                        }]
                      },
                      "hint": {
                        "type": "string"
                      },
                      "pattern": {
                        "type": "array",
                        "minItems": 2,
                        "items": [{
                          "oneOf": [{
                            "type": "string"
                          }, {
                            "instanceof": "RegExp"
                          }]
                        }, {
                          "type": "string"
                        }]
                      },
                      "field": {
                        "$ref": "field_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d"
                      },
                      "fields": {
                        "$ref": "fields_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d"
                      },
                      "types": {
                        "$ref": "fields_4be0cf9d-cc93-4d38-9c75-3fd30b602e1d"
                      }
                    },
                    "select": {
                      "$data": "0/widget"
                    },
                    "selectCases": {
                      "unknown": {},
                      "string": {},
                      "number": {
                        "properties": {
                          "step": {
                            "type": "number"
                          },
                          "value_type": {
                            "type": "string"
                          },
                          "min": {
                            "type": "number"
                          },
                          "max": {
                            "type": "number"
                          }
                        }
                      },
                      "text": {},
                      "image": {
                        "properties": {
                          "allow_multiple": {
                            "type": "boolean"
                          }
                        }
                      },
                      "file": {
                        "properties": {
                          "allow_multiple": {
                            "type": "boolean"
                          }
                        }
                      },
                      "select": {
                        "properties": {
                          "multiple": {
                            "type": "boolean"
                          },
                          "min": {
                            "type": "integer"
                          },
                          "max": {
                            "type": "integer"
                          },
                          "options": {
                            "type": "array",
                            "items": {
                              "oneOf": [{
                                "type": "string"
                              }, {
                                "type": "number"
                              }, {
                                "type": "object",
                                "properties": {
                                  "label": {
                                    "type": "string"
                                  },
                                  "value": {
                                    "oneOf": [{
                                      "type": "string"
                                    }, {
                                      "type": "number"
                                    }]
                                  }
                                },
                                "required": ["label", "value"]
                              }]
                            }
                          }
                        },
                        "required": ["options"]
                      },
                      "markdown": {
                        "properties": {
                          "minimal": {
                            "type": "boolean"
                          },
                          "buttons": {
                            "type": "array",
                            "items": {
                              "type": "string",
                              "enum": ["bold", "italic", "code", "link", "heading-one", "heading-two", "heading-three", "heading-four", "heading-five", "heading-six", "quote", "bulleted-list", "numbered-list"]
                            }
                          },
                          "editor_components": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            }
                          },
                          "modes": {
                            "type": "array",
                            "items": {
                              "type": "string",
                              "enum": ["raw", "rich_text"]
                            },
                            "minItems": 1
                          }
                        }
                      },
                      "list": {
                        "properties": {
                          "allow_add": {
                            "type": "boolean"
                          },
                          "collapsed": {
                            "type": "boolean"
                          },
                          "summary": {
                            "type": "string"
                          },
                          "minimize_collapsed": {
                            "type": "boolean"
                          },
                          "label_singular": {
                            "type": "string"
                          },
                          "i18n": {
                            "type": "boolean"
                          },
                          "min": {
                            "type": "number"
                          },
                          "max": {
                            "type": "number"
                          }
                        }
                      },
                      "object": {
                        "properties": {
                          "collapsed": {
                            "type": "boolean"
                          },
                          "i18n": {
                            "type": "boolean"
                          }
                        }
                      },
                      "relation": {
                        "properties": {
                          "collection": {
                            "type": "string"
                          },
                          "value_field": {
                            "type": "string"
                          },
                          "search_fields": {
                            "type": "array",
                            "minItems": 1,
                            "items": {
                              "type": "string"
                            }
                          },
                          "file": {
                            "type": "string"
                          },
                          "multiple": {
                            "type": "boolean"
                          },
                          "min": {
                            "type": "integer"
                          },
                          "max": {
                            "type": "integer"
                          },
                          "display_fields": {
                            "type": "array",
                            "minItems": 1,
                            "items": {
                              "type": "string"
                            }
                          },
                          "options_length": {
                            "type": "integer"
                          }
                        },
                        "oneOf": [{
                          "required": ["collection", "value_field", "search_fields"]
                        }, {
                          "required": ["collection", "valueField", "searchFields"]
                        }]
                      },
                      "boolean": {},
                      "map": {
                        "properties": {
                          "decimals": {
                            "type": "integer"
                          },
                          "type": {
                            "type": "string",
                            "enum": ["Point", "LineString", "Polygon"]
                          }
                        }
                      },
                      "date": {},
                      "datetime": {
                        "properties": {
                          "format": {
                            "type": "string"
                          },
                          "date_format": {
                            "oneOf": [{
                              "type": "string"
                            }, {
                              "type": "boolean"
                            }]
                          },
                          "time_format": {
                            "oneOf": [{
                              "type": "string"
                            }, {
                              "type": "boolean"
                            }]
                          },
                          "picker_utc": {
                            "type": "boolean"
                          }
                        }
                      },
                      "code": {
                        "properties": {
                          "default_language": {
                            "type": "string"
                          },
                          "allow_language_selection": {
                            "type": "boolean"
                          },
                          "output_code_only": {
                            "type": "boolean"
                          },
                          "keys": {
                            "type": "object",
                            "properties": {
                              "code": {
                                "type": "string"
                              },
                              "lang": {
                                "type": "string"
                              }
                            }
                          }
                        }
                      },
                      "color": {}
                    },
                    "required": ["name"]
                  },
                  "uniqueItemProperties": ["name"]
                }
              },
              "required": ["name", "label", "file", "fields"]
            },
            "uniqueItemProperties": ["name"]
          },
          "identifier_field": {
            "type": "string"
          },
          "summary": {
            "type": "string"
          },
          "slug": {
            "type": "string"
          },
          "path": {
            "type": "string"
          },
          "preview_path": {
            "type": "string"
          },
          "preview_path_date_field": {
            "type": "string"
          },
          "create": {
            "type": "boolean"
          },
          "publish": {
            "type": "boolean"
          },
          "hide": {
            "type": "boolean"
          },
          "editor": {
            "type": "object",
            "properties": {
              "preview": {
                "type": "boolean"
              }
            }
          },
          "format": {
            "type": "string",
            "enum": ["yml", "yaml", "toml", "json", "frontmatter", "json-frontmatter", "toml-frontmatter", "yaml-frontmatter"]
          },
          "extension": {
            "type": "string"
          },
          "frontmatter_delimiter": {
            "type": ["string", "array"],
            "minItems": 2,
            "maxItems": 2,
            "items": {
              "type": "string"
            }
          },
          "fields": {
            "$id": "fields_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e",
            "type": "array",
            "minItems": 1,
            "items": {
              "$id": "field_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e",
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "label": {
                  "type": "string"
                },
                "widget": {
                  "type": "string"
                },
                "required": {
                  "type": "boolean"
                },
                "i18n": {
                  "oneOf": [{
                    "type": "boolean"
                  }, {
                    "type": "string",
                    "enum": ["translate", "duplicate", "none"]
                  }]
                },
                "hint": {
                  "type": "string"
                },
                "pattern": {
                  "type": "array",
                  "minItems": 2,
                  "items": [{
                    "oneOf": [{
                      "type": "string"
                    }, {
                      "instanceof": "RegExp"
                    }]
                  }, {
                    "type": "string"
                  }]
                },
                "field": {
                  "$ref": "field_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e"
                },
                "fields": {
                  "$ref": "fields_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e"
                },
                "types": {
                  "$ref": "fields_2adbd682-fad2-4d92-a8a2-d5235f5f6a9e"
                }
              },
              "select": {
                "$data": "0/widget"
              },
              "selectCases": {
                "unknown": {},
                "string": {},
                "number": {
                  "properties": {
                    "step": {
                      "type": "number"
                    },
                    "value_type": {
                      "type": "string"
                    },
                    "min": {
                      "type": "number"
                    },
                    "max": {
                      "type": "number"
                    }
                  }
                },
                "text": {},
                "image": {
                  "properties": {
                    "allow_multiple": {
                      "type": "boolean"
                    }
                  }
                },
                "file": {
                  "properties": {
                    "allow_multiple": {
                      "type": "boolean"
                    }
                  }
                },
                "select": {
                  "properties": {
                    "multiple": {
                      "type": "boolean"
                    },
                    "min": {
                      "type": "integer"
                    },
                    "max": {
                      "type": "integer"
                    },
                    "options": {
                      "type": "array",
                      "items": {
                        "oneOf": [{
                          "type": "string"
                        }, {
                          "type": "number"
                        }, {
                          "type": "object",
                          "properties": {
                            "label": {
                              "type": "string"
                            },
                            "value": {
                              "oneOf": [{
                                "type": "string"
                              }, {
                                "type": "number"
                              }]
                            }
                          },
                          "required": ["label", "value"]
                        }]
                      }
                    }
                  },
                  "required": ["options"]
                },
                "markdown": {
                  "properties": {
                    "minimal": {
                      "type": "boolean"
                    },
                    "buttons": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "enum": ["bold", "italic", "code", "link", "heading-one", "heading-two", "heading-three", "heading-four", "heading-five", "heading-six", "quote", "bulleted-list", "numbered-list"]
                      }
                    },
                    "editor_components": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "modes": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "enum": ["raw", "rich_text"]
                      },
                      "minItems": 1
                    }
                  }
                },
                "list": {
                  "properties": {
                    "allow_add": {
                      "type": "boolean"
                    },
                    "collapsed": {
                      "type": "boolean"
                    },
                    "summary": {
                      "type": "string"
                    },
                    "minimize_collapsed": {
                      "type": "boolean"
                    },
                    "label_singular": {
                      "type": "string"
                    },
                    "i18n": {
                      "type": "boolean"
                    },
                    "min": {
                      "type": "number"
                    },
                    "max": {
                      "type": "number"
                    }
                  }
                },
                "object": {
                  "properties": {
                    "collapsed": {
                      "type": "boolean"
                    },
                    "i18n": {
                      "type": "boolean"
                    }
                  }
                },
                "relation": {
                  "properties": {
                    "collection": {
                      "type": "string"
                    },
                    "value_field": {
                      "type": "string"
                    },
                    "search_fields": {
                      "type": "array",
                      "minItems": 1,
                      "items": {
                        "type": "string"
                      }
                    },
                    "file": {
                      "type": "string"
                    },
                    "multiple": {
                      "type": "boolean"
                    },
                    "min": {
                      "type": "integer"
                    },
                    "max": {
                      "type": "integer"
                    },
                    "display_fields": {
                      "type": "array",
                      "minItems": 1,
                      "items": {
                        "type": "string"
                      }
                    },
                    "options_length": {
                      "type": "integer"
                    }
                  },
                  "oneOf": [{
                    "required": ["collection", "value_field", "search_fields"]
                  }, {
                    "required": ["collection", "valueField", "searchFields"]
                  }]
                },
                "boolean": {},
                "map": {
                  "properties": {
                    "decimals": {
                      "type": "integer"
                    },
                    "type": {
                      "type": "string",
                      "enum": ["Point", "LineString", "Polygon"]
                    }
                  }
                },
                "date": {},
                "datetime": {
                  "properties": {
                    "format": {
                      "type": "string"
                    },
                    "date_format": {
                      "oneOf": [{
                        "type": "string"
                      }, {
                        "type": "boolean"
                      }]
                    },
                    "time_format": {
                      "oneOf": [{
                        "type": "string"
                      }, {
                        "type": "boolean"
                      }]
                    },
                    "picker_utc": {
                      "type": "boolean"
                    }
                  }
                },
                "code": {
                  "properties": {
                    "default_language": {
                      "type": "string"
                    },
                    "allow_language_selection": {
                      "type": "boolean"
                    },
                    "output_code_only": {
                      "type": "boolean"
                    },
                    "keys": {
                      "type": "object",
                      "properties": {
                        "code": {
                          "type": "string"
                        },
                        "lang": {
                          "type": "string"
                        }
                      }
                    }
                  }
                },
                "color": {}
              },
              "required": ["name"]
            },
            "uniqueItemProperties": ["name"]
          },
          "sortable_fields": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "sortableFields": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "view_filters": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "properties": {
                "label": {
                  "type": "string"
                },
                "field": {
                  "type": "string"
                },
                "pattern": {
                  "oneOf": [{
                    "type": "boolean"
                  }, {
                    "type": "string"
                  }]
                }
              },
              "additionalProperties": false,
              "required": ["label", "field", "pattern"]
            }
          },
          "view_groups": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "properties": {
                "label": {
                  "type": "string"
                },
                "field": {
                  "type": "string"
                },
                "pattern": {
                  "type": "string"
                }
              },
              "additionalProperties": false,
              "required": ["label", "field"]
            }
          },
          "nested": {
            "type": "object",
            "properties": {
              "depth": {
                "type": "number",
                "minimum": 1,
                "maximum": 1000
              },
              "summary": {
                "type": "string"
              }
            },
            "required": ["depth"]
          },
          "meta": {
            "type": "object",
            "properties": {
              "path": {
                "type": "object",
                "properties": {
                  "label": {
                    "type": "string"
                  },
                  "widget": {
                    "type": "string"
                  },
                  "index_file": {
                    "type": "string"
                  }
                },
                "required": ["label", "widget", "index_file"]
              }
            },
            "additionalProperties": false,
            "minProperties": 1
          },
          "i18n": {
            "oneOf": [{
              "type": "boolean"
            }, {
              "type": "object",
              "properties": {
                "structure": {
                  "type": "string",
                  "enum": ["multiple_folders", "multiple_files", "single_file"]
                },
                "locales": {
                  "type": "array",
                  "minItems": 2,
                  "items": {
                    "type": "string",
                    "minLength": 2,
                    "maxLength": 10,
                    "pattern": "^[a-zA-Z-_]+$"
                  },
                  "uniqueItems": true
                },
                "default_locale": {
                  "type": "string",
                  "minLength": 2,
                  "maxLength": 10,
                  "pattern": "^[a-zA-Z-_]+$"
                }
              }
            }]
          }
        },
        "required": ["name", "label"],
        "oneOf": [{
          "required": ["files"]
        }, {
          "required": ["folder", "fields"]
        }],
        "not": {
          "required": ["sortable_fields", "sortableFields"]
        },
        "if": {
          "required": ["extension"]
        },
        "then": {
          "if": {
            "properties": {
              "extension": {
                "enum": ["yml", "yaml", "toml", "json", "md", "markdown", "html"]
              }
            }
          },
          "else": {
            "required": ["format"]
          }
        },
        "dependencies": {
          "frontmatter_delimiter": {
            "properties": {
              "format": {
                "enum": ["yaml-frontmatter", "toml-frontmatter", "json-frontmatter"]
              }
            },
            "required": ["format"]
          }
        }
      },
      "uniqueItemProperties": ["name"]
    },
    "editor": {
      "type": "object",
      "properties": {
        "preview": {
          "type": "boolean"
        }
      }
    }
  },
  "required": ["backend", "collections"],
  "anyOf": [{
    "required": ["media_folder"]
  }, {
    "required": ["media_library"]
  }]
};
validate.errors = null;
module.exports = validate;