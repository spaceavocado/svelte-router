import { HISTORY_MODE, HASH_TYPE } from './history';
import { RouteConfigPrefab } from './route';
/**
 * History lib configuration.
 */
interface HistoryOptions {
    /** The base URL of the app, defaults to ''. */
    basename?: string;
    /** Hash type. */
    hashType?: string;
}
/**
 * Router configuration.
 */
interface RouterConfig {
    /** History mode */
    mode: HISTORY_MODE;
    /** The base URL of the app, defaults to ''. */
    basename?: string;
    /** Hash type. */
    hashType: HASH_TYPE;
    /** Router routes. */
    routes: RouteConfigPrefab[];
    /** CSS class applied on the active route link. Defaults to "active". */
    activeClass?: string;
    /** History options */
    historyOpts?: HistoryOptions;
}
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
export default createRouter;
