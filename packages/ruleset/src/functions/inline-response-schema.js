const each = require('lodash/each');
const {
  walk,
  isJsonMimeType,
  isPrimitiveType,
  isResponseObject
} = require('../utils');

const errorMessage =
  'Response schemas should be defined as a $ref to a named schema.';

/**
 * Checks to make sure that response schemas are defined as a ref to a named schema,
 * rather than an inline schema.
 * Even if the referenced schema is only used once, naming it offers significant benefits for SDK generation,
 * because the SDK generator will use the name of the referenced schema as the operation's return type, and
 * allowing the generator to perform its automatic refactoring will result in sub-optimal names.
 * @param {*} apidef the entire (un-resolved) API definition
 * @returns an array containing the violations found or [] if no violations
 */
function inlineResponseSchema(apidef) {
  const errors = [];

  // Walk the entire API definition
  walk(apidef, [], function(obj, path) {
    const isRef = !!obj.$ref;

    // If this is the "responses" object for an operation or
    // the "components.responses" field, then perform the checks.
    if (isResponseObject(path) && !isRef) {
      each(obj, (response, responseKey) => {
        each(response.content, (mediaType, mediaTypeKey) => {
          if (mediaType.schema && isJsonMimeType(mediaTypeKey)) {
            if (
              !mediaType.schema.$ref &&
              !isPrimitiveType(mediaType.schema) &&
              !arrayItemsAreRefOrPrimitive(mediaType.schema)
            ) {
              errors.push({
                message: errorMessage,
                path: [...path, responseKey, 'content', mediaTypeKey, 'schema']
              });
            }
          }
        });
      });
    }
  });

  return errors;
}

/**
 * Returns true if "schema" is an array with an "item" schema
 * that is either a reference or a primitive type.
 * @param {*} schema the schema to check
 * @returns boolean
 */
function arrayItemsAreRefOrPrimitive(schema) {
  return (
    schema &&
    schema.type === 'array' &&
    schema.items &&
    (schema.items.$ref || isPrimitiveType(schema.items))
  );
}

module.exports = inlineResponseSchema;
