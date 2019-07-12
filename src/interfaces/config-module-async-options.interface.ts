/** Dependencies **/
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

/** Interfaces **/
import { ConfigModuleOptions } from './config-module-options.interface';
import { ConfigOptionsFactory } from './config-options-factory.interface';

export interface ConfigModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<ConfigOptionsFactory>;
  useExisting?: Type<ConfigOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<ConfigModuleOptions> | ConfigModuleOptions;
}
