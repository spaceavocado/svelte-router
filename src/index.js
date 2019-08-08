/**
 * Svelte Router module
 * @module svelte-router
 */

// Libs
import 'core-js/stable';

// Internals
import {HISTORY_MODE as ROUTER_MODE, HASH_TYPE} from './history';
import createRouter, {router} from './router.js';

// Components
import RouterLink from './component/link.svelte';
import RouterView from './component/view.svelte';

export {
  /**
   * Router supported mode enum.
   * **Exported**.
   * @type {module:svelte-router/history~HISTORY_MODE}
   */
  ROUTER_MODE,
  /**
   * Router supported hash types enum.
   * **Exported**.
   * @type {module:svelte-router/history~HASH_TYPE}
   */
  HASH_TYPE,
  /**
   * Router store.
   * Svelte readable of type module:svelte-router.Router.
   * **Exported**.
   * @see {module:svelte-router.Router}
   * @type {object}
   */
  router,
  RouterLink,
  RouterView,
};

/**
 * Create a router in read-only store.
 * **Default export form the module**.
 * @see {module:svelte-router.Router}
 * @type {function}
 * @param {object} opts Router constructor options.
 * @return {object} Svelte readable of type module:svelte-router.Router
 */
export default createRouter;
