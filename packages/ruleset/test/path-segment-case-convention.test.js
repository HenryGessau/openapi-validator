const { pathSegmentCaseConvention } = require('../src/rules');
const { makeCopy, rootDocument, testRule, severityCodes } = require('./utils');

const rule = pathSegmentCaseConvention;
const ruleId = 'path-segment-case-convention';
const expectedSeverity = severityCodes.error;

describe('Spectral rule: path-segment-case-convention', () => {
  describe('Should not yield errors', () => {
    it('Clean spec', async () => {
      const results = await testRule(ruleId, rule, rootDocument);
      expect(results).toHaveLength(0);
    });

    it('Empty path segment', async () => {
      const testDocument = makeCopy(rootDocument);

      testDocument.paths['/v1//drinks//last_seg'] =
        testDocument.paths['/v1/drinks'];
      delete testDocument.paths['/v1/drinks'];

      const results = await testRule(ruleId, rule, testDocument);
      expect(results).toHaveLength(0);
    });
  });

  describe('Should yield errors', () => {
    it('Path segments are camel case', async () => {
      const testDocument = makeCopy(rootDocument);

      testDocument.paths['/v1/thisIsATest/drinks/anotherTest'] =
        testDocument.paths['/v1/drinks'];
      delete testDocument.paths['/v1/drinks'];

      const results = await testRule(ruleId, rule, testDocument);
      expect(results).toHaveLength(2);
      for (const result of results) {
        expect(result.code).toBe(ruleId);
        expect(result.message).toMatch(/^Path segments must be snake case:/);
        expect(result.severity).toBe(expectedSeverity);
        expect(result.path.join('.')).toBe(
          'paths./v1/thisIsATest/drinks/anotherTest'
        );
      }
    });
    it('Path segment has a .', async () => {
      const testDocument = makeCopy(rootDocument);

      testDocument.paths['/v1/bad.segment/drinks'] =
        testDocument.paths['/v1/drinks'];
      delete testDocument.paths['/v1/drinks'];

      const results = await testRule(ruleId, rule, testDocument);
      expect(results).toHaveLength(1);
      for (const result of results) {
        expect(result.code).toBe(ruleId);
        expect(result.message).toMatch(/^Path segments must be snake case:/);
        expect(result.severity).toBe(expectedSeverity);
        expect(result.path.join('.')).toBe('paths./v1/bad.segment/drinks');
      }
    });
  });
});
