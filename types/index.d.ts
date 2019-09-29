/**
 * Svelte Router module
 * @module svelte-router
 */
import { HISTORY_MODE as ROUTER_MODE, HASH_TYPE } from './history';
import createRouter, { router } from './router';
import { urlMatch, urlPrefix, trimPrefix } from './utils';
export { 
/**
 * Router supported mode enum.
 */
ROUTER_MODE, 
/**
 * Router supported hash types enum.
 */
HASH_TYPE, 
/**
 * Router store.
 * Svelte readable of type module:svelte-router.Router.
 */
router, urlMatch, urlPrefix, trimPrefix, };
/**
 * Create a router in read-only store.
 */
export default createRouter;
