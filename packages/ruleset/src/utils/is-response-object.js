function isResponseObject(path) {
  const operations = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace'
  ];

  const pathLength = path.length;

  // a necessary but not sufficient check for a response object
  // without these, a schema property named "responses"
  // may be validated as a response
  const isResponsesProperty = path[pathLength - 1] === 'responses';

  // three scenarios:
  // 1) inside of an operation
  const isOperationResponse = operations.includes(path[pathLength - 2]);

  // 2) inside of components -> responses
  const isResponseInComponents =
    pathLength === 2 && path[pathLength - 2] === 'components';

  return isResponsesProperty && (isOperationResponse || isResponseInComponents);
}

module.exports = isResponseObject;
