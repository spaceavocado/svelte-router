/**
 * Svelte Router module
 * @module svelte-router
 */

import {Readable, readable} from 'svelte/store';

// Internals
import {HISTORY_MODE as ROUTER_MODE, HASH_TYPE} from './history';
import Router, {RouterConfig} from './router';
import {urlMatch, urlPrefix, trimPrefix} from './utils';

export {
  /**
   * Router supported mode enum.
   */
  ROUTER_MODE,
  /**
   * Router supported hash types enum.
   */
  HASH_TYPE,
  urlMatch,
  urlPrefix,
  trimPrefix,
};

export type {RouterConfig} from './router';
export type {Route, RouteConfigPrefab} from './route';
export type {RawLocation} from './location';

/**
 * Router store.
 * Svelte readable store of type [[Router]].
 */
export let router: Readable<Router>;

/**
 * Create a router in read-only store.
 * Default module export.
 * @param {RouterConfig} opts Router constructor options.
 * @return {object} Svelte readable store of type [[Router]].
 */
const createRouter = (opts: RouterConfig): object => {
  router = readable(new Router(opts));
  return router;
};

/**
 * Create a router in read-only store.
 */
export default createRouter;
