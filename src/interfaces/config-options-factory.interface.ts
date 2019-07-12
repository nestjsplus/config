import { ConfigModuleOptions } from './config-module-options.interface';

export interface ConfigOptionsFactory {
  createConfigOptions(): Promise<ConfigModuleOptions> | ConfigModuleOptions;
}
