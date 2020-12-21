const path = require('path');
const commandLineValidator = require('../../../src/cli-validator/runValidator');
const config = require('../../../src/cli-validator/utils/processConfiguration');
const { getCapturedText } = require('../../test-utils');

describe(' spectral - test info and hint rules - OAS3', function() {
  it('test Spectral info and hint rules', async function() {
    // Set config to mock .spectral.yml file before running
    const mockPath = path.join(
      __dirname,
      '../mockFiles/mockConfig/info-and-hint.yaml'
    );
    const mockConfig = jest
      .spyOn(config, 'getSpectralRuleset')
      .mockReturnValue(mockPath);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // set up mock user input
    const program = {};
    program.args = ['./test/spectral/mockFiles/oas3/enabled-rules.yml'];
    program.default_mode = true;
    program.json = true;

    // Note: validator does not set exitcode for jsonOutput
    await commandLineValidator(program);

    // Ensure mockConfig was called and revert it to its original state
    expect(mockConfig).toHaveBeenCalled();
    mockConfig.mockRestore();

    const capturedText = getCapturedText(consoleSpy.mock.calls);
    const jsonOutput = JSON.parse(capturedText);

    consoleSpy.mockRestore();

    // Verify errors
    expect(jsonOutput['errors']['spectral'].length).toBe(2);

    // Verify warnings
    expect(jsonOutput['warnings']['spectral'].length).toBe(10);

    // Verify infos
    expect(jsonOutput['infos']['spectral'].length).toBe(5);
    expect(jsonOutput['infos']['spectral'][0]['message']).toEqual(
      'Markdown descriptions should not contain `<script>` tags.'
    );
    expect(jsonOutput['infos']['spectral'][4]['message']).toEqual(
      'Operation tags should be defined in global tags.'
    );

    // Verify hints
    expect(jsonOutput['hints']['spectral'].length).toBe(2);
    expect(jsonOutput['hints']['spectral'][0]['message']).toEqual(
      'OpenAPI object should have non-empty `tags` array.'
    );
    expect(jsonOutput['hints']['spectral'][1]['message']).toEqual(
      'Operation should have non-empty `tags` array.'
    );
  });
});
