<h1 align="center">NestJs Configuration Manager</h1>

<h3 align="center">Flexible, Docker-friendly, Dotenv-based Configuration Module for NestJs</h3>

<div align="center">
  <a href="https://github.com/johnbiundo/nestjs-config-manager/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="License" />
  </a>
  <a href="https://badge.fury.io/js/nestjs-config-manager">
    <img src="https://badge.fury.io/js/nestjs-config-manager.svg" alt="npm version" height="18">
  </a>
</div>

<div align="center">
  <img src="https://user-images.githubusercontent.com/6937031/60838684-23cc7b00-a180-11e9-8343-2b81fe151c48.png">
</div>

## Features
* Simply install, configure, set up a `dotenv` file and go
* Based on good ole [`dotenv`]() (not a fork/extension)
* Docker-friendly: e.g., use `.env` files in dev/test, environment variables in production, or any combination
* [Joi]()-based validation of environment variables
* Completely dynamic and customizable determination of the name/location of your `.env` file
  * means: no code changes to handle unique configs per environment
* Default values (i.e., optional environment variables with default values)
* Type-safe (e.g., `configMgr.get<number>('PORT')` returns a number (no more `parseInt()`)
* Easy to layer your own config service on top of the Configuration Manager to provide features like
  * typeORM or database module `getConfiguration()` methods returning arbitrarily nested config objects
  * name spacing (e.g., `configMgr.get('DB.PASSWORD'))`
* Dynamic module enables easy configuration
* Dynamic module allows easy override for testing
* Trace how an environment variable was resolved (external environment, `.env` file or default) to help debug tricky problems between dev, test, production
* Choice to allow or prohibit **extra** environment variables (e.g., allow/reject `.env` file with variables not matching schema)
* Choice to shut down the app (`process.exit`), throw an exception, or continue on configuration errors
  * exception has detailed validation errors for easy testing
* Uses system logger (i.e., respects overrides)
* Uses [`debug`]() to let you see inside the module at runtime
* Defined as a `Global` Nest module for default import into any module

## Documentation
[Why another NestJs configuration manager?](https://github.com/johnbiundo/nestjs-config-manager/wiki)

## Basic Usage
You can [read more about **how** nestjs-config-manager works](https://github.com/johnbiundo/nestjs-config-manager/wiki) if you want.

The package has one global Nest module (`ConfigManagerModule`), and one main class (`ConfigManager`) that you'll need to work with.  The main idea is to create **your own** "ConfigService" (in the examples, we'll call it `ConfigService`), but you can call it whatever you want. You probably want this in its own module (in the examples,
we'll call it `ConfigModule`), which you probably want to be global.  You'll then export your `ConfigService` for use
in the rest of your application.  This approach affords you a great deal of flexibility:
* Centralized setup of the `ConfigurationModule/Service`
* Use Dependency Injection to gain access to the service wherever needed
* Easily override/mock the service for testing

Following these conventions, your `ConfigModule` might look like this:
```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigManagerModule } from 'nestjs-config-manager';
import { ConfigService } from './config.service';

@Global()
@Module({
  imports: [
    ConfigManagerModule.register({
      useFile: 'config/test.env',
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

This "registers" the `ConfigManagerModule`, which is how you configure it.  This
example explicitly provides a full path to the `.env` file.  The path is relative
to the root directory for the project, or the root directory in which the app is
running.  For example, if the app currently has a structure like:
```bash
myprojects
├── src
│   └── module1
├── dist
├── node_modules
├── test
├── config
|   └── test.env
└── package.json
```

This would look for a `dotenv`-formatted file in:
`myprojects/config/test.env`


And your `ConfigService` might look like this:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigManager } from 'nestjs-config-manager';
import * as Joi from 'joi';

@Injectable()
export class ConfigService extends ConfigManager {
  provideConfigSpec() {
    return {
      DB_HOST: {
        validate: Joi.string(),
        required: true,
      },
      DB_USER: {
        validate: Joi.string(),
        required: true,
      },
      DB_PORT: {
        validate: Joi.number()
          .min(5000)
          .max(65535),
        required: false,
        default: 5432,
      },
      PORT: {
        validate: Joi.number()
          .min(3000)
          .max(500),
        required: false,
        default: 3000,
      },
    };
  }
}
```

Your `ConfigService` (you can choose any name you want) is created as a derived
class that extends the `ConfigManager` class from the package.  You **must**
implement the `provideConfigSpec()` method. This is where you define your schema.
Read [more about schemas here](https://github.com/johnbiundo/nestjs-config-manager/wiki)

## Change Log

See [Changelog](CHANGELOG.md) for more information.

## Contributing

Contributions welcome! See [Contributing](CONTRIBUTING.md).

## Author

* **John Biundo (Y Prospect)**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
