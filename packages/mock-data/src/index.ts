/**
 * Fake data for the front-end MVP. Nothing in the apps imports this package
 * directly — they go through `@schoolcoin/api-client`, whose mock engine owns
 * a `DbState` created by `createSeed()`. Delete this package (and the mock
 * engine) once the Express API is live.
 */
export * from './state';
export * from './seed';
