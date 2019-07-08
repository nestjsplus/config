import { Inject, Logger } from '@nestjs/common';
import { CONFIG_OPTIONS } from './constants';
import { ConfigOptions, EnvHash } from './interfaces';

export abstract class AbstractConfigManager {
  protected readonly logger = new Logger('ConfigManager', false);

  protected readonly procEnv: EnvHash;

  constructor(@Inject(CONFIG_OPTIONS) public options: ConfigOptions) {
    this.procEnv = Object.assign({}, process.env);
    this.loadAndValidateEnvFile();
  }

  protected abstract loadAndValidateEnvFile();
}
