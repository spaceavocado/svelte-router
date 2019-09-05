import {readable} from 'svelte/store';
import pathToRegexp from 'path-to-regexp';
import createHistory, {HISTORY_MODE, HISTORY_ACTION, HASH_TYPE}
  from './history';
import {createLocation} from './location';
import {joinPath, fullURL, historyFullURL, hasPrefix, trimPrefix}
  from './utils';
import {createRouteConfig, createRouteRecord, createRoute, cloneRoute}
  from './route';
import tc from '@spaceavocado/type-check';

/**
 * Svelte Router core class.
 * @memberof module:svelte-router
 */
class Router {
  /**
   * @constructor
   * @param {object} opts router options.
   * @param {module:svelte-router/history~HISTORY_MODE} opts.mode History mode.
   * @param {string?} opts.basename The base URL of the app, defaults to ''.
   * @param {module:svelte-router/history~HASH_TYPE?} opts.hashType Hash type.
   * Relevant only for HISTORY_MODE.HASH.
   * @param {array?} opts.routes router routes.
   * @param {string?} opts.activeClass CSS class applied on the
   * active route link. Defaults to "active".
   */
  constructor(opts) {
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
    this._routes = opts.routes || [];
    this._activeClass = opts.activeClass || 'active';
    this._history = createHistory(this._mode, opts.historyOpts || {});
    this._historyListener = this._history.listen(
        this._onHistoryChange.bind(this)
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
    this._pendingRoute = {};

    // Async views
    this._asyncViews = new Map();

    // Preprocess routes
    this._preprocessRoutes(this._routes);
  }

  /**
   * Trigger the on load history change.
   */
  start() {
    this._onHistoryChange(this._history.location, HISTORY_ACTION.POP);
  }

  /**
   * Get router mode
   * @type {module:svelte-router/history~HISTORY_MODE}
   */
  get mode() {
    return this._mode;
  }

  /**
   * Get router basename
   * @type {string}
   */
  get basename() {
    return this._basename;
  }

  /**
   * Get current resolved route
   * @type {module:svelte-router/route~Route}
   */
  get currentRoute() {
    return this._currentRoute;
  }

  /**
   * Get router link active class
   * @type {string}
   */
  get activeClass() {
    return this._activeClass;
  }

  /**
   * Register a navigation guard which will be called
   * whenever a navigation is triggered.
   * All registered navigation guards are resolved in sequence.
   * Navigation guard must call the next() function to continue
   * the execution of navigation change.
   * @param {function} guard guard callback function
   * with (from, to, next) signature.
   * @return {function} remove guard function.
   */
  navigationGuard(guard) {
    const key = Symbol();
    this._navigationGuards.push({
      key,
      guard,
    });
    const self = this;
    return () => {
      self._removeListener(self._navigationGuards, key);
    };
  }

  /**
   * Register a callback which will be called before
   * execution of navigation guards.
   * @param {function} callback callback function
   * with fn(from, to) signature.
   * @return {function} remove listener function.
   */
  onBeforeNavigation(callback) {
    const key = Symbol();
    this._listeners.onBeforeNavigation.set(key, callback);
    const self = this;
    return () => {
      self._listeners.onBeforeNavigation.delete(key);
    };
  }

  /**
   * Register a callback which will be called when
   * all navigation guards are resolved, and the final
   * navigation change is resolved.
   * @param {function} callback callback function
   * with fn(from, to) signature.
   * @return {function} remove listener function.
   */
  onNavigationChanged(callback) {
    const key = Symbol();
    this._listeners.onNavigationChanged.set(key, callback);
    const self = this;
    return () => {
      self._listeners.onNavigationChanged.delete(key);
    };
  }

  /**
   * Register a callback which will be called when an error
   * is caught during a route navigation.
   * @param {function} callback callback function
   * with fn(error) signature.
   * @return {function} unregister callback function.
   */
  onError(callback) {
    const key = Symbol();
    this._listeners.onError.set(key, callback);
    const self = this;
    return () => {
      self._listeners.onError.delete(key);
    };
  }

  /**
   * Push to navigation.
   * @param {string|module:svelte-router/location~RawLocation} rawLocation raw
   * path or location object.
   * @param {function?} onComplete On complete callback function.
   * @param {function?} onAbort On abort callback function.
   * @throws when the rawLocation is invalid or when the path is invalid.
   */
  push(rawLocation, onComplete, onAbort) {
    let location;
    try {
      location = this._rawLocationToLocation(rawLocation, false);
    } catch (e) {
      if (tc.isFunction(onAbort)) {
        onAbort();
      }
      this._notifyOnError(
          new Error(`invalid location, ${e.toString()}`)
      );
      return;
    }

    this._resolveRoute(location,
      tc.isFunction(onComplete) ? onComplete : null,
      tc.isFunction(onAbort) ? onAbort : null,
    );
  }

  /**
   * Replace in navigation
   * @param {string|module:svelte-router/location~RawLocation} rawLocation raw
   * path or location object.
   * @param {function?} onComplete On complete callback function.
   * @param {function?} onAbort On abort callback function.
   * @throws when the rawLocation is invalid or when the path is invalid.
   */
  replace(rawLocation, onComplete, onAbort) {
    let location;
    try {
      location = this._rawLocationToLocation(rawLocation, true);
    } catch (e) {
      if (tc.isFunction(onAbort)) {
        onAbort();
      }
      this._notifyOnError(
          new Error(`invalid location, ${e.toString()}`)
      );
      return;
    }

    this._resolveRoute(location,
      tc.isFunction(onComplete) ? onComplete : null,
      tc.isFunction(onAbort) ? onAbort : null,
    );
  }

  /**
   * Go to a specific history position in the navigation history.
   * @param {number} n number of steps to forward
   * or backwards (negative number).
   */
  go(n) {
    this._history.go(n);
  }

  /**
   * Go one step back in the navigation history.
   */
  back() {
    this._history.goBack();
  }

  /**
   * Go one step forward in the navigation history.
   */
  forward() {
    this._history.goForward();
  }

  /**
   * Generate route URL from the the raw location.
   * @param {module:svelte-router/location~RawLocation} rawLocation raw
   * location object.
   * @throws when the route is not found or the route params are not valid.
   * @return {string}
   */
  routeURL(rawLocation) {
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
    const match = this._findRouteByName(rawLocation.name, this._routes);
    if (match == null) {
      throw new Error(`no matching route found for name:${rawLocation.name}`);
    }

    // Try to generate the route URL with the given params
    // to validate the route and to get the params
    let url = '';
    try {
      url = match.generator(rawLocation.params || {});
    } catch (e) {
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
   * @private
   * @param {object[]} routes collection of route prefabs.
   * @param {svelte-router/route.Config?} parent route.
   */
  _preprocessRoutes(routes, parent = null) {
    for (let i = 0; i < routes.length; i++) {
      try {
        routes[i] = createRouteConfig(routes[i]);
        routes[i].parent = null;
      } catch (e) {
        console.error(new Error(`invalid route, ${e.toString()}`));
        continue;
      }

      // Append parent path prefix
      if (parent != null) {
        routes[i].parent = parent;
        if (routes[i].path.length > 0) {
          routes[i].path = joinPath(parent.path, routes[i].path);
        } else {
          routes[i].path = parent.path;
        }
      }

      // Generate the regex matcher and params keys
      routes[i].paramKeys = [];
      // Any URL
      if (routes[i].path == '*') {
        routes[i].matcher = /.*/i;
        routes[i].generator = () => '/';
      // Regex based
      } else {
        routes[i].matcher = pathToRegexp(
            routes[i].path,
            routes[i].paramKeys, {
              end: routes[i].children.length == 0,
            });
        routes[i].generator = pathToRegexp.compile(routes[i].path);
      }

      // Process children
      if (routes[i].children.length > 0) {
        this._preprocessRoutes(routes[i].children, routes[i]);
      }
    }
  }

  /**
   * On history change event.
   * @private
   * @param {object} location location object
   * @param {string} location.pathname The path of the URL.
   * @param {string} location.key A unique string representing this location.
   * @param {string} location.hash The URL hash fragment.
   * @param {string} location.search The URL query string.
   * @param {string} location.state Extra state for this location.
   * @param {module:svelte-router/history~HISTORY_ACTION} action
   */
  _onHistoryChange(location, action) {
    // Resolve route when the history is popped.
    if (action == HISTORY_ACTION.POP) {
      this.push(historyFullURL(location));
    }
  }

  /**
   * Convert raw Location to Location.
   * @private
   * @param {string|module:svelte-router/location~RawLocation} rawLocation raw
   * path or location object.
   * @param {boolean} replace history replace flag.
   * @throws when the rawLocation is invalid or when the path is invalid.
   * @return {module:svelte-router/location~Location}
   */
  _rawLocationToLocation(rawLocation, replace) {
    if (tc.isNullOrUndefined(rawLocation)) {
      throw new Error('invalid rawLocation');
    }
    if (tc.isString(rawLocation)) {
      rawLocation = {
        path: rawLocation,
      };
    }
    rawLocation.replace = replace;

    let location;
    try {
      location = createLocation(rawLocation);
    } catch (e) {
      throw e;
    }
    return location;
  }

  /**
   * Resolve route from the requested location.
   * @private
   * @param {svelte-router/location.Location} location
   * @param {function|null} onComplete navigation change request callback.
   * @param {function|null} onAbort navigation change request callback.
   */
  _resolveRoute(location, onComplete, onAbort) {
    let matches = [];

    if (this._basename.length > 0) {
      location.path = trimPrefix(location.path, this._basename);
    }

    // Resolve named route
    if (location.name != null) {
      let match = this._findRouteByName(location.name, this._routes);
      if (match == null) {
        if (onAbort != null) {
          onAbort();
        }
        this._notifyOnError(
            new Error(`no matching route found for name:${location.name}`)
        );
        return;
      }

      // Try to generate the route URL with the given params
      // to validate the route and to get the params
      try {
        location.path = match.generator(location.params);
      } catch (e) {
        if (onAbort != null) {
          onAbort();
        }
        this._notifyOnError(
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
      if (this._matchRoute(location.path, this._routes, matches) == false) {
        if (onAbort != null) {
          onAbort();
        }
        this._notifyOnError(
            new Error(`no matching route found for path:${location.path}`)
        );
        return;
      }
    }

    // Create new pending route
    this._pendingRoute = createRoute(location, matches);

    // Resolve redirect
    if (this._pendingRoute.redirect != null) {
      this._resolveRedirect(this._pendingRoute.redirect, onComplete, onAbort);
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
    this._notifyOnBeforeNavigation(
        Object.freeze(cloneRoute(this._currentRoute)),
        Object.freeze(cloneRoute(this._pendingRoute))
    );

    // Resolve navigation guards
    this._resolveNavigationGuard(0, onComplete, onAbort);
  }

  /**
   * Match route by path, recursively.
   * @private
   * @param {string} path base path without query or hash
   * @param {svelte-router/route.Config[]} routes
   * @param {svelte-router/route.Record[]} matches
   * @return {boolean}
   */
  _matchRoute(path, routes, matches) {
    for (let i = 0; i < routes.length; i++) {
      const match = routes[i].matcher.exec(path);
      if (match) {
        matches.push(createRouteRecord(routes[i], match));
        // Final route
        if (routes[i].children.length == 0) {
          return true;
        }
        // Segment
        if (this._matchRoute(path, routes[i].children, matches)) {
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
   * @private
   * @param {string} name name of the route.
   * @param {object[]} routes a
   * @return {object}
   */
  _findRouteByName(name, routes) {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].name == name) {
        return routes[i];
      }
      const match = this._findRouteByName(name, routes[i].children);
      if (match != null) {
        return match;
      }
    }
    return null;
  }

  /**
   * Resolve pending route redirect.
   * @private
   * @param {string|object|function} redirect url, route, callback function.
   * @param {function|null} onComplete navigation change request callback.
   * @param {function|null} onAbort navigation change request callback.
   */
  _resolveRedirect(redirect, onComplete, onAbort) {
    // Function
    if (tc.isFunction(redirect)) {
      redirect = redirect(this._pendingRoute);
    }

    // External
    if (tc.isString(redirect) && hasPrefix(redirect, 'http')) {
      window.location.replace(redirect);
      return;
    }

    // URL or Route object
    this._pendingRoute = null;
    this.push(redirect, onComplete, onAbort);
  }

  /**
   * Resolve each navigation guard on the given index
   * It executes the navigation guard function, chained by calling of
   * the next function.
   * @private
   * @param {number} index of the navigation guard, defaults to 0.
   * @param {function|null} onComplete navigation change request callback.
   * @param {function|null} onAbort navigation change request callback.
   */
  _resolveNavigationGuard(index = 0, onComplete, onAbort) {
    // There are no other guards
    // finish the navigation change
    if (index >= this._navigationGuards.length) {
      this._finishNavigationChange(onComplete, onAbort);
      return;
    }

    // Abort the pending route
    const abort = (err = null) => {
      this._pendingRoute = null;
      if (onAbort != null) {
        onAbort();
      }
      if (err != null) {
        this._notifyOnError(
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
        (next) => {
          // Continue to next guard
          if (next == undefined) {
            this._resolveNavigationGuard(++index, onComplete, onAbort);
          // Cancel the route change
          } else if (next === false) {
            abort();
          // Error
          } else if (tc.isError(next)) {
            abort(next);
          // Go to different route
          } else if (tc.isString(next) || tc.isObject(next)) {
            this._pendingRoute = null;
            this.push(next, onComplete, onAbort);
          // Unexpected next
          } else {
            abort(new Error(`unexpected next(val) value.`));
          }
        });
  }

  /**
   * Notify all onError listeners
   * @private
   * @param {Error} error
   */
  _notifyOnError(error) {
    for (const callback of this._listeners.onError.values()) {
      callback(error);
    }
  }

  /**
   * Notify all onBeforeNavigation listeners
   * @private
   * @param {svelte-router/route.Record} from route
   * @param {svelte-router/route.Record} to route
   */
  _notifyOnBeforeNavigation(from, to) {
    for (const callback of this._listeners.onBeforeNavigation.values()) {
      callback(from, to);
    }
  }

  /**
   * Notify all onNavigationChanged listeners
   * @private
   * @param {svelte-router/route.Record} from route
   * @param {svelte-router/route.Record} to route
   */
  _notifyOnNavigationChanged(from, to) {
    for (const callback of this._listeners.onNavigationChanged.values()) {
      callback(from, to);
    }
  }

  /**
   * Update the current route and update the navigation history
   * to complete the route change.
   * @private
   * @param {function|null} onComplete navigation change request callback.
   * @param {function|null} onAbort navigation change request callback.
   */
  _finishNavigationChange(onComplete, onAbort) {
    const asyncPending = [];
    for (const r of this._pendingRoute.matched) {
      if (r.async == false) {
        continue;
      }
      if (this._asyncViews.has(r.id) == false) {
        asyncPending.push(new Promise((resolve, reject) => {
          r.component
              .then((m) => resolve({id: r.id, component: m.default}))
              .catch((e) => reject(e));
        }));
      }
    }

    // After all components are resolved.
    const afterResolved = () => {
      // Get the resolved components for async views
      for (const r of this._pendingRoute.matched) {
        if (r.async == false) {
          continue;
        }
        r.component = this._asyncViews.get(r.id);
      }

      // notify all listeners and update the history
      this._notifyOnNavigationChanged(
          Object.freeze(cloneRoute(this._currentRoute)),
          Object.freeze(cloneRoute(this._pendingRoute))
      );

      this._currentRoute = cloneRoute(this._pendingRoute);
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
          this._asyncViews.set(v.id, v.component);
        }
        afterResolved();
      }).catch((e) => {
        this._notifyOnError(
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
   * Remove a listener from a generic collection of listeners.
   * The match is determined by key (typeof Symbol) property.
   * @private
   * @param {object[]} listeners generic collection of listeners.
   * @param {Symbol} key listener key
   */
  _removeListener(listeners, key) {
    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i].key === key) {
        listeners.splice(i, 1);
        break;
      }
    }
  }
}

/**
 * Router store.
 * Svelte readable of type module:svelte-router~Router.
 * **Exported**.
 * @ignore
 * @type {object}
 */
export let router;

/**
 * Create a router in read-only store.
 * **Default export form the module**.
 * @ignore
 * @param {object} opts Router constructor options.
 * @return {object} Svelte readable of type module:svelte-router~Router
 */
const createRouter = (opts) => {
  router = readable(new Router(opts));
  return router;
};

export default createRouter;
