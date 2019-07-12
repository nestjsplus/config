import { Module, DynamicModule, Provider } from '@nestjs/common';
import { CONFIG_OPTIONS } from './constants';
import {
  ConfigModuleOptions,
  ConfigModuleAsyncOptions,
  ConfigOptionsFactory,
} from './interfaces';

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
  public static register(options: ConfigModuleOptions): DynamicModule {
    return {
      module: ConfigManagerModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
      ],
      exports: [CONFIG_OPTIONS],
    };
  }

  static registerAsync(options: ConfigModuleAsyncOptions): DynamicModule {
    return {
      module: ConfigManagerModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
      exports: [CONFIG_OPTIONS],
    };
  }

  private static createAsyncProviders(
    options: ConfigModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: ConfigModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: CONFIG_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      name: CONFIG_OPTIONS,
      provide: CONFIG_OPTIONS,
      useFactory: async (optionsFactory: ConfigOptionsFactory) => {
        return optionsFactory.createConfigOptions();
      },
      inject: [options.useExisting || options.useClass],
    };
  }
}
