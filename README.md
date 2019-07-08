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

## Top Features
* Docker-friendly: e.g., use `.env` files in dev/test, environment variables in production, or any combination
* [Joi]()-based validation of environment variables
* Completely dynamic and customizable determination of the name/location of your `.env` file
  * means: no code changes to handle unique configs per environment
* Default values (i.e., optional environment variables with default values)
* Trace how an environment variable was resolved (external environment, `.env` file or default) to help debug tricky problems between dev, test, production

[Full Feature List](https://github.com/johnbiundo/nestjs-config-manager/wiki/Features)

## Documentation
[Why another NestJs configuration manager?](https://github.com/johnbiundo/nestjs-config-manager/wiki)

[How it works](https://github.com/johnbiundo/nestjs-config-manager/wiki/How-it-works)

[Schemas](https://github.com/johnbiundo/nestjs-config-manager/wiki/Schemas)

[Module Configuration Options](https://github.com/johnbiundo/nestjs-config-manager/wiki/Module-configuration-options)

## Quick Start - Read This First
You can [read more about **how** nestjs-config-manager works](https://github.com/johnbiundo/nestjs-config-manager/wiki/How-it-works) if you want. But this section should get you started quickly.

The package has one global Nest module (`ConfigManagerModule`), and one main class (`ConfigManager`) that you'll need to work with.  The main idea is to create **your own** *ConfigService* (in the examples, we'll call it `ConfigService`), but you can call it whatever you want. You probably want this in its own module (in the examples,
we'll call it `ConfigModule`), which you probably want to be global.  You'll then *provide* your `ConfigService` for use in the rest of your application.  This approach affords you a great deal of flexibility:
* Centralized setup of the `ConfigurationModule/Service`
* Use Dependency Injection to provide the service wherever needed
* Easily override/mock the service for testing

Following these conventions, your `ConfigModule` might look like this:
```typescript
// src/config/config.module.ts
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

This imports and *registers* the `ConfigManagerModule`, which is how you configure it.  In this
example, we explicitly provide a full path to the `.env` file via the `useFile` configuration option.
This is simple, but not terribly flexible.  We'll explore more flexible options
[below](#Dynamic-env-file-example). When using a static file path with `useFile`, the path is relative
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

This would result in the `ConfigManagerModule` looking for a `dotenv`-formatted file in:
`myprojects/config/test.env`


Your `ConfigService` might look like this:
```typescript
// src/config/config.service.ts
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
      FIRST_NAME: {
        validate: Joi.string(),
        required: true,
      }
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

Your `ConfigService` (you can choose any name you want) is a **derived
class** that extends the `ConfigManager` class provided by the package.  You **must**
implement the `provideConfigSpec()` method. This is where you define your schema.
Read [more about schemas here](https://github.com/johnbiundo/nestjs-config-manager/wiki/Schemas).

With this in place, you can use your `ConfigService` anywhere in your project.  For example, assuming
a `.env` file like:
```bash
// config/test.env
FIRST_NAME=John
.
.
.
```

A service like this:
```typescript
// src/app.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from './config/config.service';

@Injectable()
export class AppService {
  private userFirstName: string;

  constructor(configService: ConfigService) {
    this.userFirstName = configService.get<string>('FIRST_NAME'));
  }

  getHello(): string {
    return `Hello ${this.userFirstName}`;
  }
}
```

Would return `Hello John` when run with this configuration.

## Dynamic env file example
Let's say you have two environments: *development* and *test*, and want to set up your
`ConfigService` to dynamically locate the `.env` file that is appropriate to each environment.
Let's assume that *development* uses one set of database credentials, and *test* uses another.

This would be well represented by having two `.env` files. Perhaps they're stored in a folder like
`myproject/config` (this is just an example; they can be stored wherever you want). The files might look like:

For *development*:

```bash
// myproject/config/development.env
DB_USER=devdbuser
DB_PASS=devdbpass
```

For *test*:
```bash
// myproject/config/test.env
DB_USER=testdbuser
DB_PASS=testdbpass
```

The `useFile()` method of configuration shown above won't work for this. You need a way to read a **different**
`.env` file for each environment. A typical approach is to use a **specific** environment variable (typically
`NODE_ENV`, though you can choose whatever you want) to indicate what the active environment is.  For example, when
running in *development*, you'd have `NODE_ENV` equal to `development`, and in *test*,
`NODE_ENV`'s value would equal `test`.

Based on this, you can use the `useEnv` method of configuring the `ConfigManagerModule`. The `useEnv` method is described in the [Module Configuration Options](https://github.com/johnbiundo/nestjs-config-manager/wiki/Module-configuration-options#Basic-dynamic-configuration) section, but a simple example is shown below.

To accommodate this requirement, we'd modify the way we register the `ConfigManagerModule` as follows, replacing
`useFile` with `useEnv`:

```typescript
// src/config/config.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigManagerModule } from 'nestjs-config-manager';
import { ConfigService } from './config.service';

@Global()
@Module({
  imports: [
    ConfigManagerModule.register({
      useEnv: {
        folder: 'config/test.env',
      }
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

If, instead of `NODE_ENV` we wanted to use an environment variable like `MY_ENVIRONMENT` to signify which environment
we're running (e.g., `MY_ENVIRONMENT` is equal to `development` when we're in our development environment), we'd
identify that environment variable using the option `envKey`, as shown below:
```typescript
// src/config/config.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigManagerModule } from 'nestjs-config-manager';
import { ConfigService } from './config.service';

@Global()
@Module({
  imports: [
    ConfigManagerModule.register({
      envKey: 'MY_ENVIRONMENT',
      useEnv: {
        folder: 'config/test.env',
      }
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

## Completely custom env file location
The `useEnv` method provides significant flexibility, but more complex structures require an even **more** flexible
approach. To handle arbitrarily complex environments, a third method, `useFunction`, is available to write custom
JavaScript code to generate the appropriate path and filename dynamically.  This is covered in [Using a custom function](https://github.com/johnbiundo/nestjs-config-manager/wiki/Module-configuration-options#Using-a-custom-function).


## Change Log

See [Changelog](CHANGELOG.md) for more information.

## Contributing

Contributions welcome! See [Contributing](CONTRIBUTING.md).

## Author

* **John Biundo (Y Prospect)**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
