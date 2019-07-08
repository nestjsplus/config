<h1 align="center">NestJs Configuration Manager</h1>

<h3 align="center">Flexible, Docker-friendly, Dotenv-based Configuration Module for NestJs</h3>

## Features
* Simply install, configure, set up a `dotenv` file and go
* Based on good ole [`dotenv`]() (not a fork/extension)
* Docker-friendly: e.g., use `.env` files in dev/test, environment variables in production, or any combination
* [Joi]()-based validation of environment variables
* Completely dynamic and customizable determination of the name/location of your `.env` file
* Default values (i.e., optional environment variables with default values)
* Type-safe (e.g., `configMgr.get<number>('PORT')` returns a number (no more `parseInt()`)
* Easy to layer your own config service on top of the Configuration Manager to provide features like
  * typeORM or database module `getConfiguration()` methods returning arbitrarily nested config objects
  * name spacing (e.g., `configMgr.get('DB.PASSWORD'))`
* Dynamic module enables easy configuration
* Dynamic module allows easy override for testing
* Uses system logger (i.e., respects overrides)
* Trace how an environment variable was resolved (external environment, `.env` file or default) to help debug tricky problems between dev, test, production
* Choice to allow or prohibit **extra** environment variables (e.g., allow/reject `.env` file with variables not matching schema)
* Uses [`debug`]() to let you see inside the module at runtime

## Install

npm

`npm install nestjs-config-manager`

## Usage