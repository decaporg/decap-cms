import parseConfig from '../parseConfig';
// const simpleConfig = require('./__fixtures__/simple-config.yml')

const simpleConfigYml = `
backend:
  name: test-repo
  delay: 0.1

media_folder: "assets/uploads"
`;

const envConfigYml = `
backend:
  name: netlify-git
  url: http://localhost:9000
  branch: master
  publish_mode: branch

production:
  backend:
    name: netlify-git
    url: https://netlify.com
    branch: netlify-site
    
media_folder: "assets/uploads"
`;

describe('parseConfig', () => {
  it('should throw if config is empty', () => {
    expect(() => parseConfig('')).toThrow('Config can not be empty.');
  });

  it('should throw if media_folder not set', () => {
    const config = `
backend:
  name: test-repo
  delay: 0.1
`;
    expect(() => parseConfig(config)).toThrow('`media_folder` must be set in config.');
  });

  it('should set publish_mode to `simple` if not set', () => {
    expect(Object.keys(parseConfig(simpleConfigYml))).toContain('publish_mode');
    expect(parseConfig(simpleConfigYml).publish_mode).toBe('simple');
  });

  it('should set publish_mode', () => {
    expect(Object.keys(parseConfig(envConfigYml))).toContain('publish_mode');
    expect(parseConfig(envConfigYml).publish_mode).toBe('branch');
  });

  it('should add a `public_folder` field if not exist', () => {
    expect(Object.keys(parseConfig(simpleConfigYml))).toContain('public_folder');
    expect(parseConfig(simpleConfigYml).public_folder).toBe('/assets/uploads');
  });

  it('should add a slash for public_folder field', () => {
    const config = `
media_folder: 'test'
public_folder: 'assets'
`;
    expect(parseConfig(config).public_folder).toBe('/assets');
  });

  it('should update values from specified env in the main config', () => {
    expect(parseConfig(envConfigYml).backend.url).toBe('http://localhost:9000');
    expect(parseConfig(envConfigYml, undefined).backend.url).toBe('http://localhost:9000');
    expect(parseConfig(envConfigYml, 'production').backend.url).toBe('https://netlify.com');
  });

  it('should delete env values from config after merge', () => {
    expect(Object.keys(parseConfig(envConfigYml, 'production'))).not.toContain('production');
  });
});
