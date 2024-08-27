import tc from '@spaceavocado/type-check';
import pathToRegexp from 'path-to-regexp';
import createHistory, {
  HISTORY_MODE,
  HISTORY_ACTION,
  HASH_TYPE,
} from './history';
import {
  Location,
  RawLocation,
  createLocation,
} from './location';
import {
  HistoryLocation,
  joinPath,
  fullURL,
  historyFullURL,
  hasPrefix,
  trimPrefix,
} from './utils';
import {
  Route,
  Record,
  RouteConfig,
  RouteConfigPrefab,
  routeRedirect,
  componentModule,
  createRouteConfig,
  createRouteRecord,
  createRoute,
  cloneRoute,
} from './route';

type historyModule = {
  action: HISTORY_ACTION;
  location: HistoryLocation;
  push: (path: string) => void;
  replace: (path: string) => void;
  go: (n: number) => void;
  goBack: () => void;
  goForward: () => void;
  listen: (listener:
    (location: HistoryLocation, action: HISTORY_ACTION) => void
  ) => () => void;
};

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
type navigationGuardNextAction = undefined | boolean | Error | string | object;
type navigationGuardFunction = (from: Route | null, to: Route | null,
  next: (action?: navigationGuardNextAction) => void) => void;

/**
 * Navigation Guard entry.
 */
interface NavigationGuard {
  key: symbol;
  guard: navigationGuardFunction;
}

type onErrorCallback = (e: Error) => void;
type onNavigationCallback = (from: Route, to: Route) => void;

/**
 * Router event listeners collection.
 */
interface EventListeners {
  onError: Map<symbol, onErrorCallback>;
  onBeforeNavigation: Map<symbol, onNavigationCallback>;
  onNavigationChanged: Map<symbol, onNavigationCallback>;
}

/**
 * Svelte Router core class.
 */
export class Router {
  private _mode: HISTORY_MODE;
  private _basename: string;
  private _routes: RouteConfig[];
  private _activeClass: string;
  private _history: historyModule;
  private _historyListener: () => void;
  private _navigationGuards: NavigationGuard[];
  private _listeners: EventListeners;
  private _currentRoute: Route | null = null;
  private _pendingRoute: Route | null = null;
  private _asyncViews: Map<symbol, () => object>;

  /**
   * @constructor
   * @param {RouterConfig} opts
   */
  constructor(opts: RouterConfig) {
    opts = opts || {};
    opts.historyOpts = {};
    opts.mode = opts.mode || HISTORY_MODE.HISTORY;
    if (tc.not.isEnumKey(opts.mode, HISTORY_MODE)) {
      throw new Error(`invalid router mode, "${opts.mode}"`);
    }

    opts.historyOpts.basename = opts.basename || '';
    if (tc.not.isString(opts.historyOpts.basename)) {
      throw new Error(`invalid basename, "${opts.historyOpts.basename}"`);
    }
    if (opts.historyOpts.basename.length > 0
      && hasPrefix(opts.historyOpts.basename, '/') == false) {
      opts.historyOpts.basename = '/' + opts.historyOpts.basename;
    }

    if (opts.mode == HISTORY_MODE.HASH) {
      opts.historyOpts.hashType = opts.hashType || HASH_TYPE.SLASH;
      if (tc.not.isEnumKey(opts.historyOpts.hashType, HASH_TYPE)) {
        throw new Error(`invalid hash type, "${opts.historyOpts.hashType}"`);
      }
      opts.historyOpts.hashType = opts.historyOpts.hashType.toLowerCase();
    }

    this._mode = opts.mode;
    this._basename = opts.historyOpts.basename;
    this._routes = [];
    this._activeClass = opts.activeClass || 'active';
    this._history = createHistory(
        this._mode, opts.historyOpts || {}
    ) as historyModule;
    this._historyListener = this._history.listen(
        this.onHistoryChange.bind(this)
    );

    // Navigation guards and listeners
    this._navigationGuards = [];
    this._listeners = {
      onError: new Map(),
      onBeforeNavigation: new Map(),
      onNavigationChanged: new Map(),
    };

    // Current resolved route and resolved pending route
    this._currentRoute = null;
    this._pendingRoute = null;

    // Async views
    this._asyncViews = new Map();

    // Preprocess routes
    this.preprocessRoutes(this._routes, opts.routes);
  }

  /**
   * Trigger the on load history change.
   */
  start(): void {
    this.onHistoryChange(this._history.location, HISTORY_ACTION.POP);
  }

  /**
   * Get router mode
   */
  get mode(): HISTORY_MODE {
    return this._mode;
  }

  /**
   * Get router basename
   */
  get basename(): string {
    return this._basename;
  }

  /**
   * Get routes
   */
  get routes(): RouteConfig[] {
    return this._routes;
  }

  /**
   * Get current resolved route
   */
  get currentRoute(): Route | null {
    return this._currentRoute;
  }

  /**
   * Get router link active class
   */
  get activeClass(): string {
    return this._activeClass;
  }

  /**
   * Register a navigation guard which will be called
   * whenever a navigation is triggered.
   * All registered navigation guards are resolved in sequence.
   * Navigation guard must call the next() function to continue
   * the execution of navigation change.
   * @param {function} guard Guard callback function.
   * @return {function} Unregister guard function.
   */
  navigationGuard(guard: navigationGuardFunction): () => void {
    const key = Symbol();
    this._navigationGuards.push({
      key,
      guard,
    });
    return (): void => {
      this.removeNavigationGuard(key);
    };
  }

  /**
   * Register a callback which will be called before
   * execution of navigation guards.
   * @param {function} callback callback function.
   * @return {function} Unregister listener function.
   */
  onBeforeNavigation(callback: onNavigationCallback): () => void {
    const key = Symbol();
    this._listeners.onBeforeNavigation.set(key, callback);
    return (): void => {
      this._listeners.onBeforeNavigation.delete(key);
    };
  }

  /**
   * Register a callback which will be called when
   * all navigation guards are resolved, and the final
   * navigation change is resolved.
   * @param {function} callback callback function.
   * @return {function} Unregister listener function.
   */
  onNavigationChanged(callback: onNavigationCallback): () => void {
    const key = Symbol();
    this._listeners.onNavigationChanged.set(key, callback);
    return (): void => {
      this._listeners.onNavigationChanged.delete(key);
    };
  }

  /**
   * Register a callback which will be called when an error
   * is caught during a route navigation.
   * @param {function} callback Callback function.
   * @return {function} Unregister callback function.
   */
  onError(callback: onErrorCallback): () => void {
    const key = Symbol();
    this._listeners.onError.set(key, callback);
    return (): void => {
      this._listeners.onError.delete(key);
    };
  }

  /**
   * Push to navigation.
   * @param {RawLocation|string} rawLocation raw path or location object.
   * @param {function?} onComplete On complete callback function.
   * @param {function?} onAbort On abort callback function.
   * @throws When the rawLocation is invalid or when the path is invalid.
   */
  push(
      rawLocation: RawLocation | string,
      onComplete?: () => void,
      onAbort?: () => void): void {
    let location;
    try {
      location = this.rawLocationToLocation(rawLocation, false);
    } catch (e: any) {
      if (onAbort && tc.isFunction(onAbort)) {
        onAbort();
      }
      this.notifyOnError(
          new Error(`invalid location, ${e.toString()}`)
      );
      return;
    }

    this.resolveRoute(location,
      tc.isFunction(onComplete) ? onComplete : undefined,
      tc.isFunction(onAbort) ? onAbort : undefined,
    );
  }

  /**
   * Replace in navigation
   * @param {RawLocation|string} rawLocation raw path or location object.
   * @param {function?} onComplete On complete callback function.
   * @param {function?} onAbort On abort callback function.
   * @throws when the rawLocation is invalid or when the path is invalid.
   */
  replace(
      rawLocation: RawLocation | string,
      onComplete?: () => void,
      onAbort?: () => void): void {
    let location;
    try {
      location = this.rawLocationToLocation(rawLocation, true);
    } catch (e: any) {
      if (onAbort && tc.isFunction(onAbort)) {
        onAbort();
      }
      this.notifyOnError(
          new Error(`invalid location, ${e.toString()}`)
      );
      return;
    }

    this.resolveRoute(location,
      tc.isFunction(onComplete) ? onComplete : undefined,
      tc.isFunction(onAbort) ? onAbort : undefined,
    );
  }

  /**
   * Go to a specific history position in the navigation history.
   * @param {number} n number of steps to forward
   * or backwards (negative number).
   */
  go(n: number): void {
    this._history.go(n);
  }

  /**
   * Go one step back in the navigation history.
   */
  back(): void {
    this._history.goBack();
  }

  /**
   * Go one step forward in the navigation history.
   */
  forward(): void {
    this._history.goForward();
  }

  /**
   * Generate route URL from the the raw location.
   * @param {RawLocation} rawLocation raw location object.
   * @throws when the route is not found or the route params are not valid.
   * @return {string}
   */
  routeURL(rawLocation: RawLocation): string {
    if (tc.isNullOrUndefined(rawLocation)) {
      throw new Error('invalid rawLocation');
    }
    if (tc.isNullOrUndefined(rawLocation.name)
    || tc.not.isString(rawLocation.name)) {
      throw new Error('missing or invalid route name');
    }
    if (tc.not.isNullOrUndefined(rawLocation.params)
    && tc.not.isObject(rawLocation.params)) {
      throw new Error('invalid params property, expected object.');
    }
    if (tc.not.isNullOrUndefined(rawLocation.query)
    && tc.not.isObject(rawLocation.query)) {
      throw new Error('invalid query property, expected object.');
    }
    if (tc.not.isNullOrUndefined(rawLocation.hash)
    && tc.not.isString(rawLocation.hash)) {
      throw new Error('invalid hash property');
    }
    rawLocation.params = rawLocation.params || {};
    rawLocation.query = rawLocation.query || {};
    rawLocation.hash = rawLocation.hash || '';

    // Try to find the route
    const match = this.findRouteByName(
        rawLocation.name as string,
        this._routes);
    if (match == null) {
      throw new Error(`no matching route found for name:${rawLocation.name}`);
    }

    // Try to generate the route URL with the given params
    // to validate the route and to get the params
    let url = '';
    try {
      url = match.generator(rawLocation.params || {});
    } catch (e: any) {
      throw new Error(`invalid route parameters, :${e.toString()}`);
    }

    // Resolve query params
    url = fullURL(url, rawLocation.query, rawLocation.hash);

    // Basename
    if (this._basename.length > 0) {
      url = joinPath(this._basename, url);
    }

    return url;
  }

  /**
   * Convert routes prefabs into route configs, recursively.
   * @param {RouteConfig[]} routes Routes reference collection.
   * @param {RouteConfigPrefab[]} prefabs Collection of route prefabs.
   * @param {RouteConfig|null} parent Parent route.
   */
  private preprocessRoutes(
      routes: RouteConfig[],
      prefabs: RouteConfigPrefab[],
      parent: RouteConfig | null = null): void {
    for (let i = 0; i < prefabs.length; i++) {
      let route: RouteConfig;
      try {
        prefabs[i].children = prefabs[i].children || [];
        route = createRouteConfig(prefabs[i]);
        route.parent = null;
        routes.push(route);
      } catch (e: any) {
        console.error(new Error(`invalid route, ${e.toString()}`));
        continue;
      }

      // Append parent path prefix
      if (parent != null) {
        route.parent = parent;
        if (route.path.length > 0) {
          route.path = joinPath(parent.path, route.path);
        } else {
          route.path = parent.path;
        }
      }

      // Generate the regex matcher and params keys
      route.paramKeys = [];
      // Any URL
      if (route.path == '*') {
        route.matcher = /.*/i;
        route.generator = (): string => '/';
      // Regex based
      } else {
        route.matcher = pathToRegexp(
            route.path,
            route.paramKeys as pathToRegexp.Key[], {
              end: (prefabs[i].children as RouteConfigPrefab[]).length == 0,
            });
        route.generator = pathToRegexp.compile(route.path);
      }

      // Process children
      if ((prefabs[i].children as RouteConfigPrefab[]).length > 0) {
        this.preprocessRoutes(
            route.children,
            prefabs[i].children as RouteConfigPrefab[],
            route
        );
      }
    }
  }

  /**
   * On history change event.
   * @param {HistoryLocation} location
   * @param {HISTORY_ACTION} action
   */
  private onHistoryChange(
      location: HistoryLocation,
      action: HISTORY_ACTION): void {
    // Resolve route when the history is popped.
    if (action == HISTORY_ACTION.POP) {
      this.push(historyFullURL(location));
    }
  }

  /**
   * Convert raw Location to Location.
   * @param {RawLocation | string} rawLocation raw path or location object.
   * @param {boolean} replace history replace flag.
   * @throws when the rawLocation is invalid or when the path is invalid.
   * @return {Location}
   */
  private rawLocationToLocation(
      rawLocation: RawLocation | string,
      replace: boolean): Location {
    if (tc.isNullOrUndefined(rawLocation)) {
      throw new Error('invalid rawLocation');
    }
    if (tc.isString(rawLocation)) {
      rawLocation = {
        path: rawLocation,
      } as RawLocation;
    }
    rawLocation.replace = replace;

    let location;
    try {
      location = createLocation(rawLocation as RawLocation);
    } catch (e: any) {
      throw e;
    }
    return location;
  }

  /**
   * Resolve route from the requested location.
   * @param {Location} location
   * @param {function?} onComplete On complete request callback.
   * @param {function?} onAbort On abort request callback.
   */
  private resolveRoute(
      location: Location,
      onComplete?: () => void,
      onAbort?: () => void): void {
    let matches: Record[] = [];

    if (this._basename.length > 0) {
      location.path = trimPrefix(location.path, this._basename);
    }

    // Resolve named route
    if (location.name) {
      let match = this.findRouteByName(location.name, this._routes);
      if (match == null) {
        if (onAbort != null) {
          onAbort();
        }
        this.notifyOnError(
            new Error(`no matching route found for name:${location.name}`)
        );
        return;
      }

      // Try to generate the route URL with the given params
      // to validate the route and to get the params
      try {
        location.path = match.generator(location.params);
      } catch (e: any) {
        if (onAbort != null) {
          onAbort();
        }
        this.notifyOnError(
            new Error(`invalid route parameters, :${e.toString()}`)
        );
        return;
      }

      // Generate the route records
      matches.push(createRouteRecord(match, location.params));
      while (match.parent != null) {
        match = match.parent;
        matches.push(createRouteRecord(match, location.params));
      }
      if (matches.length > 1) {
        matches = matches.reverse();
      }

    // Resolved route by path
    // and generate the route records
    } else {
      if (this.matchRoute(location.path, this._routes, matches) == false) {
        if (onAbort != null) {
          onAbort();
        }
        this.notifyOnError(
            new Error(`no matching route found for path:${location.path}`)
        );
        return;
      }
    }

    // Create new pending route
    this._pendingRoute = createRoute(location, matches);

    // Resolve redirect
    if (this._pendingRoute.redirect != null) {
      this.resolveRedirect(this._pendingRoute.redirect, onComplete, onAbort);
      return;
    }

    // Skip the same location
    if (this._currentRoute
    && this._pendingRoute.fullPath == this._currentRoute.fullPath) {
      this._pendingRoute = null;
      if (onComplete != null) {
        onComplete();
      }
      return;
    }

    Object.freeze(this._currentRoute);
    Object.freeze(this._pendingRoute);

    // Notify all before navigation listeners
    this.notifyOnBeforeNavigation(
        Object.freeze(cloneRoute(this._currentRoute as Route)),
        Object.freeze(cloneRoute(this._pendingRoute as Route))
    );

    // Resolve navigation guards
    this.resolveNavigationGuard(0, onComplete, onAbort);
  }

  /**
   * Match route by path, recursively.
   * @param {string} path Base path without query or hash.
   * @param {RouteConfig[]} routes All routes.
   * @param {Record[]} matches Matched routes.
   * @return {boolean}
   */
  private matchRoute(
      path: string,
      routes: RouteConfig[],
      matches: Record[]): boolean {
    for (let i = 0; i < routes.length; i++) {
      const match = routes[i].matcher.exec(path);
      if (match) {
        matches.push(createRouteRecord(routes[i], match));
        // Final route
        if (routes[i].children.length == 0) {
          return true;
        }
        // Segment
        if (this.matchRoute(path, routes[i].children, matches)) {
          return true;
        } else {
          matches.pop();
        }
      }
    }
    return false;
  }

  /**
   * Find route by name, recursively.
   * @param {string} name Name of the route.
   * @param {RouteConfig[]} routes Route config collection.
   * @return {RouteConfig|null}
   */
  private findRouteByName(
      name: string,
      routes: RouteConfig[]): RouteConfig | null {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].name == name) {
        return routes[i];
      }
      const match = this.findRouteByName(name, routes[i].children);
      if (match != null) {
        return match;
      }
    }
    return null;
  }

  /**
   * Resolve pending route redirect.
   * @param {function|object|string} redirect Redirect resolver.
   * @param {function?} onComplete On complete callback.
   * @param {function?} onAbort On abort callback.
   */
  private resolveRedirect(
      redirect: routeRedirect,
      onComplete: undefined | (() => void),
      onAbort: undefined | (() => void)): void {
    // Function
    if (tc.isFunction(redirect)) {
      redirect =
        (redirect as (to: Route) => string)(this._pendingRoute as Route);
    }

    // External
    if (tc.isString(redirect) && hasPrefix(redirect as string, 'http')) {
      window.location.replace(redirect as string);
      return;
    }

    // URL or Route object
    this._pendingRoute = null;
    this.push(tc.isString(redirect)
      ? redirect as string
      : redirect as RawLocation,
    onComplete, onAbort);
  }

  /**
   * Resolve each navigation guard on the given index
   * It executes the navigation guard function, chained by calling of
   * the next function.
   * @param {number} index Index of the navigation guard, defaults to 0.
   * @param {function?} onComplete On complete callback.
   * @param {function?} onAbort On abort callback.
   */
  private resolveNavigationGuard(
      index = 0,
      onComplete: undefined | (() => void),
      onAbort: undefined | (() => void)): void {
    // There are no other guards
    // finish the navigation change
    if (index >= this._navigationGuards.length) {
      this.finishNavigationChange(onComplete, onAbort);
      return;
    }

    // Abort the pending route
    const abort = (err: Error | null = null): void => {
      this._pendingRoute = null;
      if (onAbort) {
        onAbort();
      }
      if (err != null) {
        this.notifyOnError(
            new Error(`navigation guard error, ${err.toString()}`)
        );
      }
      // Revert history if needed
      if (this._currentRoute != null &&
      (historyFullURL(this._history.location) != this._currentRoute.fullPath)) {
        this._history.push(this._currentRoute.fullPath);
      }
    };

    // Execute the navigation guard and wait for the next callback
    this._navigationGuards[index].guard(
        this._currentRoute,
        this._pendingRoute,
        (next: navigationGuardNextAction) => {
          // Continue to next guard
          if (next == undefined) {
            this.resolveNavigationGuard(++index, onComplete, onAbort);
          // Cancel the route change
          } else if (next === false) {
            abort();
          // Error
          } else if (tc.isError(next)) {
            abort(next as Error);
          // Go to different route
          } else if (tc.isString(next) || tc.isObject(next)) {
            this._pendingRoute = null;
            this.push(next as string, onComplete, onAbort);
          // Unexpected next
          } else {
            abort(new Error(`unexpected next(val) value.`));
          }
        });
  }

  /**
   * Notify all onError listeners
   * @param {Error} error
   */
  private notifyOnError(error: Error): void {
    for (const callback of this._listeners.onError.values()) {
      callback(error);
    }
  }

  /**
   * Notify all onBeforeNavigation listeners
   * @param {Route} from Current route.
   * @param {Route} to Resolved route.
   */
  private notifyOnBeforeNavigation(from: Route, to: Route): void {
    for (const callback of this._listeners.onBeforeNavigation.values()) {
      callback(from, to);
    }
  }

  /**
   * Notify all onNavigationChanged listeners
   * @param {Route} from Current route.
   * @param {Route} to Resolved route.
   */
  private notifyOnNavigationChanged(from: Route, to: Route): void {
    for (const callback of this._listeners.onNavigationChanged.values()) {
      callback(from, to);
    }
  }

  /**
   * Update the current route and update the navigation history
   * to complete the route change.
   * @param {function?} onComplete On complete callback.
   * @param {function?} onAbort On abort callback.
   */
  private finishNavigationChange(
      onComplete?: () => void,
      onAbort?: () => void): void {
    if (this._pendingRoute == null) {
      throw new Error('navigation cannot be finished, missing pending route');
    }
    const asyncPending: object[] = [];
    for (const r of this._pendingRoute.matched) {
      if (r.async == false) {
        continue;
      }
      if (this._asyncViews.has(r.id) == false) {
        asyncPending.push(new Promise((resolve, reject): void => {
          (r.component as Promise<componentModule>)
              .then((m) => resolve({id: r.id, component: m.default}))
              .catch((e) => reject(e));
        }));
      }
    }

    // After all components are resolved.
    const afterResolved = (): void => {
      if (this._pendingRoute == null) {
        throw new Error('navigation cannot be finished, missing pending route');
      }
      // Get the resolved components for async views
      for (const r of this._pendingRoute.matched) {
        if (r.async == false) {
          continue;
        }
        r.component = this._asyncViews.get(r.id) as () => object;
      }

      // notify all listeners and update the history
      this.notifyOnNavigationChanged(
          Object.freeze(cloneRoute(this._currentRoute as Route)),
          Object.freeze(cloneRoute(this._pendingRoute as Route))
      );

      this._currentRoute = cloneRoute(this._pendingRoute as Route);
      this._pendingRoute = null;

      // Resolve history update if needed
      if (historyFullURL(this._history.location)
      != this._currentRoute.fullPath) {
        // Push
        if (this._currentRoute.action == HISTORY_ACTION.PUSH) {
          this._history.push(this._currentRoute.fullPath);
        // Replace
        } else if (this._currentRoute.action == HISTORY_ACTION.REPLACE) {
          this._history.replace(this._currentRoute.fullPath);
        }
      }

      if (onComplete != null) {
        onComplete();
      }
    };

    // Resolve lazy loaded async components
    if (asyncPending.length > 0) {
      Promise.all(asyncPending).then((views) => {
        for (const v of views) {
          const view = v as {id: symbol; component: () => object};
          this._asyncViews.set(view.id, view.component);
        }
        afterResolved();
      }).catch((e) => {
        this.notifyOnError(
            new Error(`failed to load async error, ${e.toString()}`)
        );
        if (onAbort != null) {
          onAbort();
        }
      });
    // No pending async components
    } else {
      afterResolved();
    }
  }

  /**
   * Remove navigation guard.
   * @param {symbol} key Navigation guard key.
   */
  private removeNavigationGuard(key: symbol): void {
    for (let i = 0; i < this._navigationGuards.length; i++) {
      if (this._navigationGuards[i].key === key) {
        this._navigationGuards.splice(i, 1);
        break;
      }
    }
  }
}

export default Router;
