// Assertation 1. If a path has a parameter, all operations must have a parameter of type
// 'path' and name 'parameterName' ( parameterName matching what is contained in curly brackets -> {} )

// Assertation 2. All path parameters must be defined at either the path or operation level.

// Assertation 3. All path segments are lower snake case
// [Removed]

// Assertation 4:
// Identical path parameters should be defined at path level rather than in the operations

const flatten = require('lodash/flatten');
const isEqual = require('lodash/isEqual');
const uniqWith = require('lodash/uniqWith');
const MessageCarrier = require('../../../utils/message-carrier');

const allowedOperations = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace'
];

module.exports.validate = function({ resolvedSpec }, config) {
  const messages = new MessageCarrier();

  config = config.paths;

  const pathNames = resolvedSpec.paths ? Object.keys(resolvedSpec.paths) : [];

  pathNames.forEach(pathName => {
    // get all path parameters contained in curly brackets
    const regex = /\{(.*?)\}/g;
    let parameters = pathName.match(regex);

    // there are path parameters, check each operation to make sure they are defined
    if (parameters) {
      // parameter strings will still have curly braces around them
      //   from regex match - take them out
      parameters = parameters.map(param => {
        return param.slice(1, -1);
      });

      const path = resolvedSpec.paths[pathName];
      const operations = Object.keys(path).filter(pathItem =>
        allowedOperations.includes(pathItem)
      );

      // paths can have a global parameters object that applies to all operations
      let globalParameters = [];
      if (path.parameters) {
        globalParameters = path.parameters
          .filter(param => param.in && param.in.toLowerCase() === 'path')
          .map(param => param.name);
      }

      operations.forEach(opName => {
        const operation = path[opName];

        // ignore validating excluded operations
        if (operation['x-sdk-exclude'] === true) {
          return;
        }

        // get array of 'names' for parameters of type 'path' in the operation
        let givenParameters = [];
        if (operation.parameters) {
          givenParameters = operation.parameters
            .filter(param => param.in && param.in.toLowerCase() === 'path')
            .map(param => param.name);
        }

        const missingParameters = [];

        parameters.forEach(name => {
          if (
            !givenParameters.includes(name) &&
            !globalParameters.includes(name)
          ) {
            missingParameters.push(name);
          }
        });
      });

      if (!operations.length) {
        const missingParameters = [];
        parameters.forEach(name => {
          if (!globalParameters.includes(name)) {
            missingParameters.push(name);
          }
        });
      }
    }

    // Assertation 4
    // Check that parameters are not defined redundantly in the operations
    if (parameters) {
      const pathObj = resolvedSpec.paths[pathName];
      const operationKeys = Object.keys(pathObj).filter(
        op => allowedOperations.indexOf(op) > -1
      );
      if (operationKeys.length > 1) {
        parameters.forEach(parameter => {
          const operationPathParams = uniqWith(
            flatten(
              operationKeys.map(op => pathObj[op].parameters).filter(Boolean)
            ).filter(p => p.name === parameter),
            isEqual
          );
          if (operationPathParams.length === 1) {
            // All definitions of this path param are the same in the operations
            const checkStatus = config.duplicate_path_parameter || 'off';
            if (checkStatus.match('error|warning')) {
              operationKeys.forEach(op => {
                if (!pathObj[op].parameters) return;
                const index = pathObj[op].parameters.findIndex(
                  p => p.name === parameter
                );
                messages.addMessage(
                  ['paths', pathName, op, 'parameters', `${index}`],
                  'Common path parameters should be defined on path object',
                  checkStatus,
                  'duplicate_path_parameter'
                );
              });
            }
          }
        });
      }
    }
  });

  return messages;
};
