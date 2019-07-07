import { Module, DynamicModule, Global } from '@nestjs/common';
import { CONFIG_OPTIONS } from './constants';
import { ConfigOptions } from './interfaces';

@Global()
@Module({})
export class ConfigManagerModule {
  /**
   * Registers a configured ConfigManagerModule for import into the current module.
   * Use this to supply options to control how the ConfigManagerModule finds the
   * `dotenv` file it uses to build the options dictionary.
   *
   * @param {configOptions} options Options to configure the ConfigManagerModule
   *
   * @returns {DynamicModule} the ConfigManagerModule, fully configured
   */
  public static register(options: ConfigOptions): DynamicModule {
    return {
      module: ConfigManagerModule,
      providers: [
        {
          name: CONFIG_OPTIONS,
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
      ],
      exports: [CONFIG_OPTIONS],
    };
  }
}
