import { ConfigManager } from './config-manager.service';
import * as Joi from '@hapi/joi';
// tslint:disable: max-classes-per-file

const defaultProcEnv = {
  NODE_ENV: 'test',
};

const config1 = {
  TEST1: {
    validate: Joi.string(),
    required: true,
  },
  TEST2: {
    validate: Joi.number(),
    required: true,
  },
  TEST3: {
    validate: Joi.number(),
    required: false,
    default: 3333,
  },
  TEST4: {
    validate: Joi.string(),
    required: false,
    default: '4444',
  },
};

// Mocking process.exit
// https://stackoverflow.com/a/50821983/3457611
const setProperty = (object, property, value) => {
  const originalProperty = Object.getOwnPropertyDescriptor(object, property);
  Object.defineProperty(object, property, { value });
  return originalProperty;
};

const mockExit = jest.fn();
setProperty(process, 'exit', mockExit);

describe('ConfigService', () => {
  describe('It compiles and starts', () => {
    test('should be defined', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test1.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      expect(configService).toBeDefined();
    });
  });

  describe('Test Module Configuration', () => {
    test('Should throw if no envKey or NODE_ENV in environment and not useFile', async () => {
      process.env = {};
      const configOpts = {
        useEnv: {
          folder: 'testconfigs',
        },
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.message).toEqual(
          'Fatal error. No envKey specified, and `NODE_ENV` is not defined.',
        );
      }
    });

    test('Should not throw if no envKey or NODE_ENV in environment and useFile', async () => {
      process.env = {};
      const configOpts = {
        useFile: 'config/test1.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }

      const configService = new CfgService(configOpts);
      expect(configService).toBeDefined();
    });
  });

  /**
   *  Test schema validations
   */
  describe('Test validations', () => {
    test('Should throw on missing required env var', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test2.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.missingKeys).toEqual(
          expect.arrayContaining(['"TEST1" is required, but missing']),
        );
      }
    });

    test('Should throw with string supplied on env var validating for number', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test3.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.validationErrors).toEqual(
          expect.arrayContaining(['"TEST2" must be a number']),
        );
      }
    });

    test('Should throw with multiple missing required env vars', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test4.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.missingKeys).toEqual(
          expect.arrayContaining([
            '"TEST1" is required, but missing',
            '"TEST2" is required, but missing',
          ]),
        );
      }
    });

    test('Should throw with missing required AND validation failure', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test5.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.missingKeys).toEqual(
          expect.arrayContaining(['"TEST1" is required, but missing']),
        );
        expect(e.validationErrors).toEqual(
          expect.arrayContaining(['"TEST2" must be a number']),
        );
      }
    });
  });

  /**
   *  Test cascading logic
   */
  describe('Test cascading', () => {
    test('Should pickup value from env when missing in dotenv', async () => {
      process.env = { NODE_ENV: 'test', TEST4: 'FOURFOURFOUR' };
      const configOpts = {
        useFile: 'config/test1.env',
        onError: 'throw',
        allowExtras: true,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST4 = configService.get('TEST4');
      expect(TEST4).toEqual('FOURFOURFOUR');
    });

    test('Should override dotenv value from env', async () => {
      process.env = { NODE_ENV: 'test', TEST1: 'def' };
      const configOpts = {
        useFile: 'config/test1.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('def');
    });

    test('Should show var in both environment and .env', async () => {
      process.env = { NODE_ENV: 'test', TEST1: 'def' };
      const configOpts = {
        useFile: 'config/test1.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const trace = configService.trace();
      expect(trace.TEST1).toEqual({
        default: '--',
        dotenv: 'abc',
        env: 'def',
        isExtra: false,
        resolvedFrom: 'env',
        resolvedValue: 'def',
      });
    });

    test('Should pick up default when missing', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test1.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const trace = configService.trace();
      expect(trace.TEST3).toEqual({
        default: config1.TEST3.default,
        dotenv: '--',
        env: '--',
        isExtra: false,
        resolvedFrom: 'default',
        resolvedValue: config1.TEST3.default,
      });
    });

    test('Should override default when present in environment', async () => {
      process.env = { NODE_ENV: 'test', TEST4: 'FOUR' };
      const configOpts = {
        useFile: 'config/test1.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const trace = configService.trace();
      expect(trace.TEST4).toEqual({
        default: config1.TEST4.default,
        dotenv: '--',
        env: 'FOUR',
        isExtra: false,
        resolvedFrom: 'env',
        resolvedValue: 'FOUR',
      });
    });

    test('Should override default when present in dotenv', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test6.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const trace = configService.trace();
      expect(trace.TEST4).toEqual({
        default: config1.TEST4.default,
        dotenv: 'FOURTYFOUR',
        env: '--',
        isExtra: false,
        resolvedFrom: 'dotenv',
        resolvedValue: 'FOURTYFOUR',
      });
    });
  });

  /**
   *  Test allow extras
   */
  describe('Test extras', () => {
    test('Should allow extra vars when allowExtras is true', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test7.env',
        onError: 'throw',
        allowExtras: true,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const trace = configService.trace();
      expect(trace.EXTRA).toEqual({
        default: '--',
        dotenv: 'abc',
        env: '--',
        isExtra: true,
        resolvedFrom: 'dotenv',
        resolvedValue: 'abc',
      });
    });

    test('Should throw when extra vars present and allowExtras is default', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test7.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.message).toEqual('Invalid Configuration');
      }
    });

    test('Should throw when extra vars present and allowExtras is false', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test7.env',
        onError: 'throw',
        allowExtras: false,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.message).toEqual('Invalid Configuration');
      }
    });
  });

  /**
   *  Test onError options
   */

  describe('Test onError options', () => {
    test('Should report errors and continue', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test1.env',
        onError: 'continue',
        allowExtras: false,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('abc');
    });

    test('Should exit on error when onError = "throw"', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test7.env',
        onError: 'exit',
        allowExtras: false,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      expect(process.exit).toBeCalled();
    });

    test('Should exit on error when onError is omitted', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test7.env',
        allowExtras: false,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      expect(process.exit).toBeCalled();
    });

    test('Should exit on error when onError is invalid', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/test7.env',
        onError: 'junk',
        allowExtras: false,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      expect(process.exit).toBeCalled();
    });
  });

  /**
   *  Test useEnv method
   */
  describe('Test useEnv', () => {
    test('Should work with useEnv and specifying NODE_ENV envKey and no folder', async () => {
      process.env = { NODE_ENV: 'test1' };
      const configOpts = {
        envKey: 'NODE_ENV',
        useEnv: true,
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('abc');
    });

    test('Should work with useEnv and specifying NODE_ENV envKey', async () => {
      process.env = { NODE_ENV: 'test1' };
      const configOpts = {
        envKey: 'NODE_ENV',
        useEnv: true,
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('abc');
    });

    test('Should work with useEnv and specifying a folder', async () => {
      process.env = { NODE_ENV: 'test1' };
      const configOpts = {
        envKey: 'NODE_ENV',
        useEnv: {
          folder: 'config',
        },
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('abc');
    });

    test('Should work with useEnv and specifying non NODE_ENV envKey', async () => {
      process.env = { NONNODE_ENV: 'test1' };
      const configOpts = {
        envKey: 'NONNODE_ENV',
        useEnv: true,
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('abc');
    });

    test('Should work with useEnv and defaulting to NODE_ENV ', async () => {
      process.env = { NODE_ENV: 'test1' };
      const configOpts = {
        useEnv: true,
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('abc');
    });
  });

  /**
   *  Test useFunction method
   */
  describe('Test useFunction', () => {
    test('Should work with useFunction and default envKey (NODE_ENV)', async () => {
      process.env = { NODE_ENV: 'test1' };
      function configResolver(rootFolder, environment) {
        return `${rootFolder}/config/${environment}.env`;
      }
      const configOpts = {
        useFunction: configResolver,
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('abc');
    });

    test('Should work with useFunction and non-default envKey', async () => {
      process.env = { ENVIRONMENT: 'test1' };
      function configResolver(rootFolder, environment) {
        return `${rootFolder}/config/${environment}.env`;
      }
      const configOpts = {
        envKey: 'ENVIRONMENT',
        useFunction: configResolver,
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('abc');
    });
  });

  /**
   *  Test various missing files
   */
  describe('Test missing files', () => {
    test('Should throw when useFile points at bad file', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        useFile: 'config/nonsense.env',
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.message).toMatch(
          /Fatal error loading environment. The following file is missing:/,
        );
      }
    });

    test('Should throw when useEnv has a bad envKey', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        envKey: 'BAD_KEY',
        useEnv: {
          folder: '',
        },
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.message).toMatch(/Bad environment key:/);
      }
    });

    test('Should throw when useEnv has a bad envKey and allowMissingEnvFile is true', async () => {
      process.env = defaultProcEnv;
      const configOpts = {
        envKey: 'BAD_KEY',
        useEnv: {
          folder: 'srcx',
        },
        onError: 'throw',
        allowMissingEnvFile: true,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.message).toMatch(/Bad environment key:/);
      }
    });

    test('Should throw when useEnv key points to bad file', async () => {
      process.env = { USELESS_KEY: 'abc' };
      const configOpts = {
        envKey: 'USELESS_KEY',
        useEnv: {
          folder: '',
        },
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.message).toMatch(
          /Fatal error loading environment. The following file is missing:/,
        );
      }
    });

    test('Should not throw when useEnv key points to bad file and allowMissingEnvFile is true', async () => {
      process.env = { NODE_ENV: 'nonsense', TEST1: 'eee', TEST2: '555' };
      const configOpts = {
        envKey: 'NODE_ENV',
        useEnv: {
          folder: '/nowhere',
        },
        onError: 'throw',
        allowMissingEnvFile: true,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }

      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('eee');
    });

    test('Should throw when useFunction points to bad file', async () => {
      process.env = { USELESS_KEY: 'abc' };
      function configResolver(rootFolder, environment) {
        return `${rootFolder}/badfolder/${environment}.env`;
      }
      const configOpts = {
        envKey: 'USELESS_KEY',
        useFunction: configResolver,
        onError: 'throw',
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      try {
        const configService = new CfgService(configOpts);
      } catch (e) {
        expect(e.message).toMatch(
          /Fatal error loading environment. The following file is missing:/,
        );
      }
    });

    test('Should not throw when useFunction points to bad file and allowMissingEnvFile is true', async () => {
      process.env = { USELESS_KEY: 'abc', TEST1: 'eee', TEST2: '555' };
      function configResolver(rootFolder, environment) {
        return `${rootFolder}/badfolder/${environment}.env`;
      }
      const configOpts = {
        envKey: 'USELESS_KEY',
        useFunction: configResolver,
        onError: 'throw',
        allowMissingEnvFile: true,
      };
      class CfgService extends ConfigManager {
        provideConfigSpec() {
          return config1;
        }
      }
      const configService = new CfgService(configOpts);
      const TEST1 = configService.get('TEST1');
      expect(TEST1).toEqual('eee');
    });
  });
});
