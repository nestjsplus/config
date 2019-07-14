<h1 align="center">NestJs Configuration Manager</h1>

<h3 align="center">Flexible, Docker-friendly, Dotenv-based Configuration Module for NestJs</h3>

<div align="center">
  <a href="https://github.com/johnbiundo/nestjs-config-manager/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="License" />
  </a>
  <a href="https://badge.fury.io/js/nestjs-config-manager">
    <img src="https://badge.fury.io/js/nestjs-config-manager.svg" alt="npm version" height="18">
  </a>
  <a href="https://nestjs.com">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg">
  </a>
</div>

<div align="center">
  <img src="https://user-images.githubusercontent.com/6937031/60838684-23cc7b00-a180-11e9-8343-2b81fe151c48.png">
</div>

<div align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="180" alt="Nest Logo" /></a>
</div>

## Top Features
* [Docker-friendly](https://github.com/johnbiundo/nestjs-config-manager/wiki/Docker): e.g., use `.env` files in dev/test, environment variables in production, or any combination
* [@hapi/joi](https://github.com/hapijs/joi)-based validation of environment variables
* Completely dynamic and customizable determination of the name/location of your `.env` file
  * means: no code changes to handle unique configs per environment
* Default values (i.e., optional environment variables with default values)
* [Trace](https://github.com/johnbiundo/nestjs-config-manager/wiki/Api#trace-method) how an environment variable was resolved (i.e., came from external environment, `.env` file or as a default value) to help debug tricky problems between dev, test, production

[Full Feature List](https://github.com/johnbiundo/nestjs-config-manager/wiki/Features)

## Documentation
- [Why another NestJs configuration module?](https://github.com/johnbiundo/nestjs-config-manager/wiki)
- [API](https://github.com/johnbiundo/nestjs-config-manager/wiki/Api)
- [How it works](https://github.com/johnbiundo/nestjs-config-manager/wiki/How-it-works)
- [Schemas](https://github.com/johnbiundo/nestjs-config-manager/wiki/Schemas)
- [Module configuration options](https://github.com/johnbiundo/nestjs-config-manager/wiki/Module-configuration-options)
- [Debug Switches](https://github.com/johnbiundo/nestjs-config-manager/wiki/Debug-switches)
- [Use with Docker](https://github.com/johnbiundo/nestjs-config-manager/wiki/Docker)
- [Full Tutorial](https://github.com/johnbiundo/nestjs-config-manager/wiki/Tutorial)

## Quick Start - Read This First
You can [read more about **how** nestjs-config-manager works](https://github.com/johnbiundo/nestjs-config-manager/wiki/How-it-works) if you want. And the simple API is [documented here](https://github.com/johnbiundo/nestjs-config-manager/wiki/Api).  But this section should get you started quickly.

The package has one global Nest module (`ConfigManagerModule`), and one main class (`ConfigManager`) that you'll need to work with.  The main idea is to create **your own** *ConfigService* (in the examples, we'll call it `ConfigService`, but you can call it whatever you want). You probably want this in its own module (in the examples,
we'll call it `ConfigModule`), which you probably want to be global.  You'll then *provide* your `ConfigService` for use in the rest of your application.  This approach affords you a great deal of flexibility:
* Centralized setup of the `ConfigurationModule/Service`
* Use Dependency Injection to provide the service wherever needed
* Easily override/mock the service for testing
* Future-proof: if you later want to switch to another 3rd party config module, your dependencies are isolated in one place

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
      useFile: 'config/development.env',
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

This imports and *registers* the `ConfigManagerModule`. The `register()` method is how you
[configure the module](https://github.com/johnbiundo/nestjs-config-manager/wiki/Module-configuration-options).
In this example, we explicitly provide a full path to the `.env` file via the `useFile` configuration option.
This is simple, but not terribly flexible.  We'll explore more flexible options
[below](#Dynamic-env-file-example). When using a static file path with `useFile`, the path is relative
to the root directory for the project, or the root directory in which the app is
running (in test and production environments).  For example, if the app currently
has a structure like:
```bash
myproject
├── src
│   └── module1
├── dist
├── node_modules
├── test
├── config
|   └── development.env
└── package.json
```

The above `useFile` configuration method would result in the `ConfigManagerModule`
looking for a `dotenv`-formatted file in:
> `myproject/config/development.env`


Your `ConfigService` might look like this:
```typescript
// src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigManager } from 'nestjs-config-manager';
import * as Joi from '@hapi/joi';

@Injectable()
export class ConfigService extends ConfigManager {
  // Our custom "schema"
  // We supply it to the ConfigManager by extending the
  // ConfigManager class and implementing the
  // provideConfigSpec() method, which simply returns
  // our custom schema
  provideConfigSpec() {
    return {
      DB_HOST: {
        validate: Joi.string(),
        required: false,
        default: 'localhost',
      },
      DB_PORT: {
        validate: Joi.number()
          .min(5000)
          .max(65535),
        required: false,
        default: 5432,
      },
      DB_USERNAME: {
        validate: Joi.string(),
        required: true,
      },
      DB_PASSWORD: {
        validate: Joi.string(),
        required: true,
      },
      DB_NAME: {
        validate: Joi.string(),
        required: true,
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
// myproject/config/development.env
DB_USERNAME=john
DB_PASSWORD=mypassword
DB_NAME=mydb
.
.
.
```

A service could then use it like this:
```typescript
// src/app.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from './config/config.service';

@Injectable()
export class AppService {
  private userName: string;

  constructor(configService: ConfigService) {
    this.userName = configService.get<string>('DB_USERNAME'));
  }

  getHello(): string {
    return `Hello ${this.userName}`;
  }
}
```

And calling `getHello()` would return
> `Hello john`
> when run with this configuration.

## Dynamic env file location example
Let's say you have two environments: *development* and *test*, and want to set up your
`ConfigService` to dynamically locate the `.env` file that is appropriate to each environment.
Let's assume that *development* uses one set of database credentials, and *test* uses another.

This would be well represented by having two `.env` files. Perhaps they're stored in a folder like
`myproject/config` (this is just an example; they can be stored wherever you want). The files might look like:

For *development*:

```bash
// myproject/config/development.env
DB_USERNAME=devdbuser
DB_PASSWORD=devdbpass
DB_NAME=devdb
```

For *test*:
```bash
// myproject/config/test.env
DB_USERNAME=testdbuser
DB_PASSWORD=testdbpass
DB_NAME=testdb
```

How can we accommodate this *dynamic file location* without modifying our code?
The `useFile()` method of configuration shown above won't work for this. You need
a way to read a **different** `.env` file for each environment. A typical
approach is to use a **specific** environment variable (typically
`NODE_ENV`, though you can choose whatever you want) to indicate what the
active environment is.  For example, when
running in *development*, you'd have `NODE_ENV` equal to `development`, and
in *test*, `NODE_ENV`'s value would equal `test`.

Based on this, you can use the `useEnv` method of configuring the `ConfigManagerModule`.
The `useEnv` method is described in the
[Module Configuration Options](https://github.com/johnbiundo/nestjs-config-manager/wiki/Module-configuration-options#Basic-dynamic-configuration)
section, but a simple example is shown below.

To accommodate this requirement, we'd modify the way we register the `ConfigManagerModule`
as follows, replacing `useFile` with `useEnv`:

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
        folder: 'config',
      }
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

If instead of `NODE_ENV` we wanted to use an environment variable like
`MY_ENVIRONMENT` to signify which environment we're running (e.g.,
`MY_ENVIRONMENT` is equal to `development` when we're in our development
environment), we'd identify that environment variable using the option `envKey`,
as shown below:
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
        folder: 'config',
      }
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

## Completely custom env file location
The `useEnv` method provides significant flexibility, but more complex structures
require an even **more** flexible approach. To handle arbitrarily complex
environments, a third method, `useFunction`, is available to write custom
JavaScript code to generate the appropriate path and filename dynamically.
This is covered in
[Using a custom function](https://github.com/johnbiundo/nestjs-config-manager/wiki/Module-configuration-options#usefunction).


## What's next?
- [How it works](https://github.com/johnbiundo/nestjs-config-manager/wiki/How-it-works)
- [Module Configuration options](https://github.com/johnbiundo/nestjs-config-manager/wiki/Module-configuration-options)
- [Schemas](https://github.com/johnbiundo/nestjs-config-manager/wiki/Schemas)
- [API](https://github.com/johnbiundo/nestjs-config-manager/wiki/Api)

## Change Log

See [Changelog](CHANGELOG.md) for more information.

## Contributing

Contributions welcome! See [Contributing](CONTRIBUTING.md).

## Author

* **John Biundo (Y Prospect on [Discord](https://discord.gg/G7Qnnhy))**

## License

Licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
