const expect = require('expect');
const {
  validate
} = require('../../../../src/plugins/validation/2and3/semantic-validators/paths-ibm');

describe('validation plugin - semantic - paths-ibm', function() {
  it('should not return an error for a missing path parameter when a path defines a global parameter', function() {
    const config = {
      paths: {
        missing_path_parameter: 'error'
      }
    };

    const spec = {
      paths: {
        '/cool_path/{id}': {
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'good global parameter',
              required: true,
              type: 'integer',
              format: 'int64'
            }
          ],
          get: {
            parameters: [
              {
                name: 'id',
                in: 'path',
                description: 'good overriding parameter',
                required: true,
                type: 'integer',
                format: 'int64'
              }
            ]
          },
          post: {
            parameters: [
              {
                name: 'id',
                in: 'body',
                description: 'bad parameter',
                required: true,
                type: 'integer',
                format: 'int64'
              }
            ]
          }
        }
      }
    };

    const res = validate({ resolvedSpec: spec }, config);
    expect(res.errors.length).toEqual(0);
    expect(res.warnings.length).toEqual(0);
  });

  it('should not return an error when incorrect path parameter is in an excluded operation', function() {
    const config = {
      paths: {
        missing_path_parameter: 'error'
      }
    };

    const spec = {
      paths: {
        '/cool_path/{id}': {
          get: {
            parameters: [
              {
                name: 'id',
                in: 'path',
                description: 'good parameter',
                required: true,
                type: 'integer',
                format: 'int64'
              }
            ]
          },
          post: {
            'x-sdk-exclude': true,
            parameters: [
              {
                name: 'id',
                in: 'body',
                description: 'bad parameter',
                required: true,
                type: 'integer',
                format: 'int64'
              }
            ]
          }
        }
      }
    };

    const res = validate({ resolvedSpec: spec }, config);
    expect(res.errors.length).toEqual(0);
    expect(res.warnings.length).toEqual(0);
  });

  it('should not return an error when incorrect path parameter is in a vendor extension', function() {
    const config = {
      paths: {
        missing_path_parameter: 'error'
      }
    };

    const spec = {
      paths: {
        '/cool_path/{id}': {
          get: {
            parameters: [
              {
                name: 'id',
                in: 'path',
                description: 'good parameter',
                required: true,
                type: 'integer',
                format: 'int64'
              }
            ]
          },
          'x-vendor-post': {
            parameters: [
              {
                name: 'id',
                in: 'body',
                description: 'bad parameter',
                required: true,
                type: 'integer',
                format: 'int64'
              }
            ]
          }
        }
      }
    };

    const res = validate({ resolvedSpec: spec }, config);
    expect(res.errors.length).toEqual(0);
    expect(res.warnings.length).toEqual(0);
  });

  it('should flag a common path parameter defined at the operation level', function() {
    const config = {
      paths: {
        duplicate_path_parameter: 'warning'
      }
    };

    const badSpec = {
      paths: {
        '/v1/api/resources/{id}': {
          get: {
            operationId: 'get_resource',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                type: 'string',
                description: 'id of the resource'
              }
            ]
          },
          post: {
            operationId: 'update_resource',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                type: 'string',
                description: 'id of the resource'
              }
            ]
          }
        }
      }
    };

    const res = validate({ resolvedSpec: badSpec }, config);
    expect(res.errors.length).toEqual(0);
    expect(res.warnings.length).toEqual(2);
    expect(res.warnings[0].path).toEqual([
      'paths',
      '/v1/api/resources/{id}',
      'get',
      'parameters',
      '0'
    ]);
    expect(res.warnings[0].message).toEqual(
      'Common path parameters should be defined on path object'
    );
    expect(res.warnings[1].path).toEqual([
      'paths',
      '/v1/api/resources/{id}',
      'post',
      'parameters',
      '0'
    ]);
    expect(res.warnings[1].message).toEqual(
      'Common path parameters should be defined on path object'
    );
  });

  it('should not flag a common path parameter defined at the operation level if descriptions are different', function() {
    const config = {
      paths: {
        duplicate_path_parameter: 'warning'
      }
    };

    const goodSpec = {
      paths: {
        '/v1/api/resources/{id}': {
          get: {
            operationId: 'get_resource',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                type: 'string',
                description: 'id of the resource to retrieve'
              }
            ]
          },
          post: {
            operationId: 'update_resource',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                type: 'string',
                description: 'id of the resource to update'
              }
            ]
          }
        }
      }
    };

    const res = validate({ resolvedSpec: goodSpec }, config);
    expect(res.errors.length).toEqual(0);
    expect(res.warnings.length).toEqual(0);
  });

  it('should not flag a common path parameter defined at the path level', function() {
    const config = {
      paths: {
        duplicate_path_parameter: 'warning'
      }
    };

    const goodSpec = {
      paths: {
        '/v1/api/resources/{id}': {
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              type: 'string',
              description: 'id of the resource to retrieve'
            }
          ],
          get: {
            operationId: 'get_resource'
          },
          post: {
            operationId: 'update_resource'
          }
        }
      }
    };

    const res = validate({ resolvedSpec: goodSpec }, config);
    expect(res.errors.length).toEqual(0);
    expect(res.warnings.length).toEqual(0);
  });

  it('should catch redundant path parameter that exists in one operation but not the other', function() {
    const config = {
      paths: {
        duplicate_path_parameter: 'warning'
      }
    };

    const goodSpec = {
      paths: {
        '/v1/api/resources/{id}': {
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              type: 'string',
              description: 'id of the resource to retrieve'
            }
          ],
          get: {
            operationId: 'get_resource',
            parameters: [
              {
                name: 'id',
                in: 'path'
              }
            ]
          },
          post: {
            operationId: 'update_resource'
          }
        }
      }
    };

    const res = validate({ resolvedSpec: goodSpec }, config);
    expect(res.errors.length).toEqual(0);
    expect(res.warnings[0].path).toEqual([
      'paths',
      '/v1/api/resources/{id}',
      'get',
      'parameters',
      '0'
    ]);
    expect(res.warnings[0].message).toEqual(
      'Common path parameters should be defined on path object'
    );
  });
});
