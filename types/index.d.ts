/**
 * Svelte Router module
 * @module svelte-router
 */
import { HISTORY_MODE as ROUTER_MODE, HASH_TYPE } from './history';
import { RouterConfig } from './router';
import { urlMatch, urlPrefix, trimPrefix } from './utils';
export { 
/**
 * Router supported mode enum.
 */
ROUTER_MODE, 
/**
 * Router supported hash types enum.
 */
HASH_TYPE, urlMatch, urlPrefix, trimPrefix, };
/**
 * Router store.
 * Svelte readable store of type [[Router]].
 */
export declare let router: object;
/**
 * Create a router in read-only store.
 * Default module export.
 * @param {RouterConfig} opts Router constructor options.
 * @return {object} Svelte readable store of type [[Router]].
 */
declare const createRouter: (opts: RouterConfig) => object;
/**
 * Create a router in read-only store.
 */
export default createRouter;
