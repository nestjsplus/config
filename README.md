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
[More about **how** nestjs-config-manager works](https://github.com/johnbiundo/nestjs-config-manager/wiki)


