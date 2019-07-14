import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as clc from 'cli-color';
import * as Joi from '@hapi/joi';

import { dbg, NO_ENV_FILE_ERROR } from './constants';
import {
  MissingOverrideError,
  InvalidConfigurationError,
  MissingEnvFileError,
} from './errors';
import { AbstractConfigManager } from './abstract.config';
import { EnvHash } from './interfaces';

@Injectable()
export class ConfigManager extends AbstractConfigManager {
  // hash that contains our config from the environment after validation
  private envConfig: EnvHash | void;

  // the resolved file path of the `.env` file
  private envFilePath: string;

  // the working environment, such as `production` or `development`, usually
  // represented by an env var like `NODE_ENV`
  private environment: string;

  // map of how each env var has been resolved
  private resolveMap;

  /**
   * Entry point called by base class.
   * Execute the steps to locate the env file, load it, and validate it
   */
  protected loadAndValidateEnvFile() {
    this.processOptions();
    this.resolveEnvFilePath();

    // Attempt to load the `.env` file.
    // By default, a missing .env file is considered a fatal error.
    // However, some projects prefer to not deploy any `.env` file in production,
    // and pull all env vars from the external environment.
    let loadedConfig;
    try {
      loadedConfig = this.loadEnvFile();
    } catch (error) {
      if (error.message === NO_ENV_FILE_ERROR) {
        if (!this.options.allowMissingEnvFile) {
          this.handleFatalError(
            `Fatal error loading environment. The following file is missing: \n${error.badpath}`,
          );
        } else {
          dbg.cfg(
            '> No env file found.  All env vars will come from external environment, if defined.',
          );
          loadedConfig = {};
        }
      }
    }

    // processing the configSpec hands us back a Joi schema (`schema`)
    // along with a map keyed by each var in the schema, with it's value
    // being an object with a single boolean `required` field
    const { schema, required } = this.processConfigSpec();

    // now we fill in any required fields that are present only in the
    // external environment (vs. in the `.env` file).  This hands us
    // back an updated config (with any missing values and defaults applied)
    // and a list of any missing keys (to be reported as errors)
    const { updatedConfig, missingKeyErrors } = this.cascadeRequiredVars(
      loadedConfig,
      required,
    );

    if (this.environment !== 'production' || process.env.TRACE_PRODUCTION) {
      dbg.trace('> resolveMap: \n', this.resolveMap);
    }

    /**
     * Validate configuration using Joi
     *
     * abortEarly causes Joi to return all validations rather than stopping at
     * first invalid condition
     */
    const { error: validationErrors, value: validatedConfig } = Joi.validate(
      updatedConfig,
      schema,
      {
        abortEarly: false,
        allowUnknown: this.options.allowExtras,
      },
    );

    dbg.cfg('> Validated result: ', validatedConfig);

    if (missingKeyErrors.length > 0 || validationErrors) {
      let validationErrorMessages = [];
      if (validationErrors) {
        validationErrorMessages = this.extractValidationErrorMessages(
          validationErrors,
        );
      }

      this.processConfigErrors(missingKeyErrors, validationErrorMessages);
      if (this.options.onError === 'throw') {
        this.logger.error(
          'Invalid configuration -- see log file and / or Exception for details',
        );
        throw new InvalidConfigurationError(
          missingKeyErrors,
          validationErrorMessages,
        );
      } else {
        this.handleFatalError('Invalid configuration');
      }
    } else {
      this.envConfig = validatedConfig;
    }
  }

  /**
   * Read and process options from module configuration
   *
   * this.options is inherited from base AbstractConfigManager class as it is
   * dynamically provided during module registration
   */
  private processOptions() {
    // default option for onError is exit
    if (!this.options.onError) {
      this.options.onError = 'exit';
    }

    let environmentKey;
    if (this.options.envKey) {
      environmentKey = this.options.envKey;
    } else if (process.env.NODE_ENV) {
      environmentKey = 'NODE_ENV';
    } else {
      // a valid envKey is required for all but useFile
      if (!this.options.useFile && !this.options.defaultEnvironment) {
        this.handleFatalError(
          'Fatal error. No envKey specified, and `NODE_ENV` is not defined.',
        );
      }
    }

    this.environment = process.env[environmentKey];
    if (
      typeof this.environment === 'undefined' &&
      this.options.hasOwnProperty('defaultEnvironment')
    ) {
      this.environment = this.options.defaultEnvironment;
    }

    // a valid environment is required for all methods but useFile
    if (!this.options.useFile && !this.isValidEnvironment(this.environment)) {
      this.handleFatalError(`Bad environment key: ${this.options.envKey}`);
    }

    if (
      this.options.onError &&
      !['continue', 'throw', 'exit'].includes(this.options.onError)
    ) {
      this.logger.warn(
        `Invalid onError value ('${this.options.onError}') specified in ConfigManagerModule.register().  Using 'exit' instead.`,
      );
      this.options.onError = 'exit';
    }

    dbg.cfg('> cfg options: ', this.options);
    dbg.cfg(`> environment (using ${environmentKey}): ${this.environment}`);
  }

  /**
   * @todo: should probably validate that env is parsable as path component
   */
  private isValidEnvironment(environment) {
    if (typeof environment === 'undefined') {
      return false;
    }
    return true;
  }

  /**
   * set this.envRoot to appropriate path to env file.
   */
  private resolveEnvFilePath() {
    let envRoot: string = '';

    // Find root to start bulding full path
    //
    // If we're in dev, just use the project root (parent of /src)
    // If not, use the current working directory
    // Fail if we can't find one
    if (process.mainModule && process.mainModule.filename) {
      envRoot = path.resolve(path.dirname(process.mainModule.filename), '..');
    } else {
      envRoot = process.cwd();
    }

    if (!envRoot) {
      this.handleFatalError('Could not locate root directory');
    }

    dbg.cfg('> envRoot: ', envRoot);
    dbg.cfg('> resolving envfile path...');

    // If useFile specified, set envFilePath and return
    if (this.options.useFile) {
      dbg.cfg('> ... from "useFile" with file:', this.options.useFile);
      this.envFilePath = path.resolve(envRoot, this.options.useFile);
      return;
    }

    // Else, if useFunction specified, use it to build envFilePath and return
    if (this.options.useFunction) {
      dbg.cfg(
        `> ... from "useFunction" with \n\trootFolder: ${envRoot}\n\tenviroment: ${this.environment}`,
      );
      this.envFilePath = this.options.useFunction(envRoot, this.environment);
      return;
    }

    if (!this.options.useEnv) {
      this.handleFatalError('Invalid or missing configuration options.');
    }

    // Otherwise, we're using the environment method
    dbg.cfg('> ... using environment');

    // Use a subfolder under the envRoot, if provided
    let envRootSubfolder: string = 'config';
    if (typeof this.options.useEnv === 'object' && this.options.useEnv.folder) {
      envRootSubfolder = this.options.useEnv.folder;
    }

    const envPrefix = this.environment;

    // construct the path to the config file
    const filePath = path.resolve(envRoot, envRootSubfolder, envPrefix);

    this.envFilePath = filePath + '.env';
  }

  /**
   * Load the env file at the given file path
   * @returns {EnvHash} parsed config file
   */
  private loadEnvFile(): EnvHash {
    dbg.cfg(clc.yellow('> Parsing dotenv config file: ', this.envFilePath));

    const config: any = dotenv.config({
      path: this.envFilePath,
    });
    if (config.error) {
      let errorMessage;
      if (config.error.code === 'ENOENT') {
        throw new MissingEnvFileError(config.error.message);
        // errorMessage = `Fatal error loading environment. The following file is missing: \n${config.error.path}`;
      } else {
        errorMessage = `Fatal unknown error loading environment: ${config.error.message}`;
        this.handleFatalError(errorMessage);
      }
    }

    dbg.cfg('> Parsed config: ', config.parsed);
    return config.parsed;
  }

  /**
   * Some vars may be required (i.e., marked as required in the configSpec), but
   * present only in the environment, not in the dotenv file. Of course dotenv
   * only loads **what's in the `.env` file!
   *
   * Since they won't be in the config parsed by dotenv, we now check the
   * environment for them.
   *
   * After checking the environment, we supply defaults for any required
   * vars that remain missing.
   *
   * @param {envHash} loadedConfig - the envHash loaded from dotenv
   * @param {object} requiredConfig - map of env keys with boolean indicating
   *    whether each is required
   * @returns
   */
  private cascadeRequiredVars(loadedConfig, requiredConfig) {
    // make a copy of the loaded config
    const updatedConfig = JSON.parse(JSON.stringify(loadedConfig));
    const missingKeyErrors = [];
    const resolveMap = {};

    Object.entries(requiredConfig).forEach(([key, value]) => {
      resolveMap[key] = {
        dotenv: updatedConfig[key] ? updatedConfig[key] : '--',
        env: this.procEnv[key] ? this.procEnv[key] : '--',
        default: requiredConfig[key].default
          ? requiredConfig[key].default
          : '--',
        resolvedFrom: this.procEnv[key]
          ? 'env'
          : updatedConfig[key]
          ? 'dotenv'
          : '--',
        isExtra: false,
      };
      updatedConfig[key] = process.env[key];
      if (requiredConfig[key].required && !updatedConfig[key]) {
        missingKeyErrors.push(`"${key}" is required, but missing`);
      }

      if (!updatedConfig[key]) {
        updatedConfig[key] = requiredConfig[key].default;
        resolveMap[key].resolvedFrom = 'default';
      }
      resolveMap[key].resolvedValue = updatedConfig[key];
    });

    // add extras to the resolveMap
    if (this.options.allowExtras) {
      Object.entries(updatedConfig).forEach(([key, value]) => {
        if (!requiredConfig[key]) {
          resolveMap[key] = {
            dotenv: updatedConfig[key] ? updatedConfig[key] : '--',
            env: this.procEnv[key] ? this.procEnv[key] : '--',
            default: '--',
            resolvedFrom: this.procEnv[key]
              ? 'env'
              : updatedConfig[key]
              ? 'dotenv'
              : '--',
            isExtra: true,
          };
          resolveMap[key].resolvedValue = updatedConfig[key];
        }
      });
    }

    dbg.cfg('> updatedConfig (after cascade): ', updatedConfig);

    this.resolveMap = resolveMap;
    return { updatedConfig, missingKeyErrors };
  }

  /**
   * Method to provide the configuration spec.  Must be overriden by user.
   */
  protected provideConfigSpec(environment): object {
    throw new MissingOverrideError();
  }

  /**
   * Read in the user-provided `configSpec` and parse it into a Joi schema
   * and a map of env var keys telling us if they're required or not
   *
   * @returns the schema and the map
   */
  private processConfigSpec(): Joi.SchemaMap {
    let configSpec;
    try {
      configSpec = this.provideConfigSpec(this.environment);
    } catch (error) {
      let errorMessage;
      if (error instanceof MissingOverrideError) {
        errorMessage =
          'Fatal error: required method provideConfigSpec missing from class extending ConfigService';
      } else {
        errorMessage = `Unhandled error from overridden provideConfigSpec: ${error.message}`;
      }
      this.handleFatalError(errorMessage);
    }

    if (!configSpec) {
      throw new Error('no schema');
    }

    const schema = {};
    const required = {};
    Object.keys(configSpec).map(key => {
      if (!configSpec[key].validate) {
        this.handleFatalError(
          `Missing required validate field in configSchema for key: ${key}`,
        );
      }
      schema[key] = configSpec[key].validate;

      if (configSpec[key].required) {
        required[key] = {
          required: true,
        };
      } else {
        if (!configSpec[key].default) {
          this.handleFatalError(
            `Missing required default field in configSchema for key: ${key}`,
          );
        }

        required[key] = {
          required: false,
          default: configSpec[key].default,
        };
      }
    });
    dbg.cfg(
      `> Loaded ${Object.keys(configSpec).length} configuration spec keys.`,
    );
    return { schema, required };
  }

  /**
   * Pretty print errors for env vars that are required but missing, or that
   * fail validation
   */
  private processConfigErrors(missingKeys, validationErrors) {
    if (missingKeys.length > 0) {
      this.logger.error(
        `Configuration error.  The following required environment variables are missing: \n--> ${missingKeys.join(
          '\n--> ',
        )}`,
      );
    }

    if (validationErrors.length > 0) {
      this.logger.error(
        `Configuration error.  The following environment variables failed validation: \n--> ${validationErrors.join(
          '\n--> ',
        )}`,
      );
    }
  }

  /**
   * Extract Joi errors into a printable format
   * @param error
   * @returns array of formatted Joi validation errors
   */
  private extractValidationErrorMessages(errors) {
    const errorMessages = [];
    for (const detail of errors.details) {
      errorMessages.push(detail.message);
    }
    return errorMessages;
  }

  /**
   * Handle fatal errors
   *
   * exit process, throw exception, or continue
   *
   * @param {string} error message
   * @throws {exception}
   */
  private handleFatalError(message) {
    switch (this.options.onError) {
      case 'throw':
        this.logger.error(`${message} -- See exception for details`);
        throw new Error(message);
      case 'continue':
        this.logger.error(
          `An error was encountered in configuration, but 'continue' was specified.`,
        );
        this.logger.error('This may cause unpredictable results!');
        break;
      default:
      case 'exit':
        this.logger.error(`${message} -- App will now exit`);
        process.exit(0);
        break;
    }
  }

  /**
   * Get the resolved environment value for the given key
   *
   * @param {string} key - name of environment variable to lookup
   * @returns the value for the input key, resolved from the environment
   */

  public get<T>(key: string): T {
    return this.envConfig[key];
  }

  /**
   * Print a resolution map showing how each variable was resolved.  For
   * example, from the `.env` file vs. from the external environment vs.
   * from a default value.
   *
   * @returns a map of the resolution of each environment variable
   */
  public trace() {
    return this.resolveMap;
  }
}
