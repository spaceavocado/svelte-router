import { HISTORY_MODE, HASH_TYPE } from './history';
import { RawLocation } from './location';
import { Route, RouteConfig, RouteConfigPrefab } from './route';
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
export interface RouterConfig {
    /** History mode */
    mode?: HISTORY_MODE;
    /** The base URL of the app, defaults to ''. */
    basename?: string;
    /** Hash type. */
    hashType?: HASH_TYPE;
    /** Router routes. */
    routes: RouteConfigPrefab[];
    /** CSS class applied on the active route link. Defaults to "active". */
    activeClass?: string;
    /** History options */
    historyOpts?: HistoryOptions;
}
/**
 * Possible actions:
 * * fn() or fn(true) = Continue.
 * * fn(false) = Abort the navigation.
 * * fn(Error) = Abort the navigation and trigger navigation error.
 * * fn(url) or fn(RawLocation) = Break the navigation
 * and resolve the new navigation.
 */
declare type navigationGuardNextAction = undefined | boolean | Error | string | object;
declare type navigationGuardFunction = (from: Route | null, to: Route | null, next: (action: navigationGuardNextAction) => void) => void;
declare type onErrorCallback = (e: Error) => void;
declare type onNavigationCallback = (from: Route, to: Route) => void;
/**
 * Svelte Router core class.
 */
export declare class Router {
    private _mode;
    private _basename;
    private _routes;
    private _activeClass;
    private _history;
    private _historyListener;
    private _navigationGuards;
    private _listeners;
    private _currentRoute;
    private _pendingRoute;
    private _asyncViews;
    /**
     * @constructor
     * @param {RouterConfig} opts
     */
    constructor(opts: RouterConfig);
    /**
     * Trigger the on load history change.
     */
    start(): void;
    /**
     * Get router mode
     */
    readonly mode: HISTORY_MODE;
    /**
     * Get router basename
     */
    readonly basename: string;
    /**
     * Get routes
     */
    readonly routes: RouteConfig[];
    /**
     * Get current resolved route
     */
    readonly currentRoute: Route | null;
    /**
     * Get router link active class
     */
    readonly activeClass: string;
    /**
     * Register a navigation guard which will be called
     * whenever a navigation is triggered.
     * All registered navigation guards are resolved in sequence.
     * Navigation guard must call the next() function to continue
     * the execution of navigation change.
     * @param {function} guard Guard callback function.
     * @return {function} Unregister guard function.
     */
    navigationGuard(guard: navigationGuardFunction): () => void;
    /**
     * Register a callback which will be called before
     * execution of navigation guards.
     * @param {function} callback callback function.
     * @return {function} Unregister listener function.
     */
    onBeforeNavigation(callback: onNavigationCallback): () => void;
    /**
     * Register a callback which will be called when
     * all navigation guards are resolved, and the final
     * navigation change is resolved.
     * @param {function} callback callback function.
     * @return {function} Unregister listener function.
     */
    onNavigationChanged(callback: onNavigationCallback): () => void;
    /**
     * Register a callback which will be called when an error
     * is caught during a route navigation.
     * @param {function} callback Callback function.
     * @return {function} Unregister callback function.
     */
    onError(callback: onErrorCallback): () => void;
    /**
     * Push to navigation.
     * @param {RawLocation|string} rawLocation raw path or location object.
     * @param {function?} onComplete On complete callback function.
     * @param {function?} onAbort On abort callback function.
     * @throws When the rawLocation is invalid or when the path is invalid.
     */
    push(rawLocation: RawLocation | string, onComplete?: () => void, onAbort?: () => void): void;
    /**
     * Replace in navigation
     * @param {RawLocation|string} rawLocation raw path or location object.
     * @param {function?} onComplete On complete callback function.
     * @param {function?} onAbort On abort callback function.
     * @throws when the rawLocation is invalid or when the path is invalid.
     */
    replace(rawLocation: RawLocation | string, onComplete?: () => void, onAbort?: () => void): void;
    /**
     * Go to a specific history position in the navigation history.
     * @param {number} n number of steps to forward
     * or backwards (negative number).
     */
    go(n: number): void;
    /**
     * Go one step back in the navigation history.
     */
    back(): void;
    /**
     * Go one step forward in the navigation history.
     */
    forward(): void;
    /**
     * Generate route URL from the the raw location.
     * @param {RawLocation} rawLocation raw location object.
     * @throws when the route is not found or the route params are not valid.
     * @return {string}
     */
    routeURL(rawLocation: RawLocation): string;
    /**
     * Convert routes prefabs into route configs, recursively.
     * @param {RouteConfig[]} routes Routes reference collection.
     * @param {RouteConfigPrefab[]} prefabs Collection of route prefabs.
     * @param {RouteConfig|null} parent Parent route.
     */
    private preprocessRoutes;
    /**
     * On history change event.
     * @param {HistoryLocation} location
     * @param {HISTORY_ACTION} action
     */
    private onHistoryChange;
    /**
     * Convert raw Location to Location.
     * @param {RawLocation | string} rawLocation raw path or location object.
     * @param {boolean} replace history replace flag.
     * @throws when the rawLocation is invalid or when the path is invalid.
     * @return {Location}
     */
    private rawLocationToLocation;
    /**
     * Resolve route from the requested location.
     * @param {Location} location
     * @param {function?} onComplete On complete request callback.
     * @param {function?} onAbort On abort request callback.
     */
    private resolveRoute;
    /**
     * Match route by path, recursively.
     * @param {string} path Base path without query or hash.
     * @param {RouteConfig[]} routes All routes.
     * @param {Record[]} matches Matched routes.
     * @return {boolean}
     */
    private matchRoute;
    /**
     * Find route by name, recursively.
     * @param {string} name Name of the route.
     * @param {RouteConfig[]} routes Route config collection.
     * @return {RouteConfig|null}
     */
    private findRouteByName;
    /**
     * Resolve pending route redirect.
     * @param {function|object|string} redirect Redirect resolver.
     * @param {function?} onComplete On complete callback.
     * @param {function?} onAbort On abort callback.
     */
    private resolveRedirect;
    /**
     * Resolve each navigation guard on the given index
     * It executes the navigation guard function, chained by calling of
     * the next function.
     * @param {number} index Index of the navigation guard, defaults to 0.
     * @param {function?} onComplete On complete callback.
     * @param {function?} onAbort On abort callback.
     */
    private resolveNavigationGuard;
    /**
     * Notify all onError listeners
     * @param {Error} error
     */
    private notifyOnError;
    /**
     * Notify all onBeforeNavigation listeners
     * @param {Route} from Current route.
     * @param {Route} to Resolved route.
     */
    private notifyOnBeforeNavigation;
    /**
     * Notify all onNavigationChanged listeners
     * @param {Route} from Current route.
     * @param {Route} to Resolved route.
     */
    private notifyOnNavigationChanged;
    /**
     * Update the current route and update the navigation history
     * to complete the route change.
     * @param {function?} onComplete On complete callback.
     * @param {function?} onAbort On abort callback.
     */
    private finishNavigationChange;
    /**
     * Remove navigation guard.
     * @param {symbol} key Navigation guard key.
     */
    private removeNavigationGuard;
}
export default Router;
