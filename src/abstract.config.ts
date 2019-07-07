import { Inject, Logger } from '@nestjs/common';
import { CONFIG_OPTIONS } from './constants';
import { ConfigOptions, EnvDictionary } from './interfaces';

export abstract class AbstractConfigManager {
  protected readonly logger = new Logger('ConfigManager', false);

  protected readonly procEnv: EnvDictionary;

  constructor(@Inject(CONFIG_OPTIONS) public options: ConfigOptions) {
    this.options.exitOnError =
      typeof this.options.exitOnError === 'undefined'
        ? true
        : this.options.exitOnError;
    this.procEnv = Object.assign({}, process.env);
    this.loadAndValidateEnvFile();
  }

  protected abstract loadAndValidateEnvFile();
}
