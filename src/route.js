/**
 * Svelte Router route module.
 * @module svelte-router/route
 */

import tc from '@spaceavocado/type-check';
import {fullURL, deepClone} from './utils';

/**
 * Route config object.
 * @typedef Config
 * @property {string} path location path use to resolve the route.
 * @property {string|object|function} redirect route redirect.
 * * string: plain URL.
 * * object: route name {name: 'ROUTE'}.
 * * function: callback function fn(to) to resolve the redirect.
 * @property {string} name name of the route.
 * @property {function} component svelte component.
 * @property {object} meta route meta object.
 * @property {boolean|object|function} props props passed to component.
 * * true: auto-resolve props from route params.
 * * object: pass this object directly to component as props.
 * * function: callback function to resolve props from route object.
 * @property {svelte-router/route~Config[]} children children routes.
 * @property {module:svelte-router/route~Config} parent parent route.
 */

/**
 * Create route config object.
 * @param {module:svelte-router/route~Config} prefab route config prefab,
 * only properties defined on svelte-router/route~Config will be used.
 * @throws Will throw an error if the route prefab config is invalid.
 * @return {module:svelte-router/route~Config}
 */
export function createRouteConfig(prefab) {
  if (tc.isNullOrUndefined(prefab) || tc.not.isObject(prefab)) {
    throw new Error('invalid route config prefab');
  }
  if (tc.isNullOrUndefined(prefab.path) || tc.not.isString(prefab.path)) {
    throw new Error('invalid route config path property');
  }
  if (tc.not.isNullOrUndefined(prefab.component)
    && tc.not.isFunction(prefab.component)) {
    throw new Error('invalid route config component property');
  }
  if (prefab.meta && tc.not.isObject(prefab.meta)) {
    throw new Error('invalid route config meta property');
  }

  if (tc.isNullOrUndefined(prefab.redirect)) {
    prefab.redirect = null;
  } else if (tc.not.isString(prefab.redirect)
    && tc.not.isObject(prefab.redirect)
    && tc.not.isFunction(prefab.redirect)) {
    throw new Error('invalid route config redirect property');
  }

  if (tc.isNullOrUndefined(prefab.props)) {
    prefab.props = false;
  } else if (prefab.props !== true
    && tc.not.isObject(prefab.props)
    && tc.not.isFunction(prefab.props)) {
    throw new Error('invalid route config props property');
  }

  return {
    path: prefab.path,
    redirect: prefab.redirect,
    component: prefab.component || false,
    name: prefab.name || null,
    meta: prefab.meta || {},
    props: prefab.props,
    children: prefab.children || [],
    parent: {},
  };
}

/**
 * Route record object.
 * @typedef Record
 * @property {string} path location path use to resolve the route.
 * @property {string|object|function} redirect route redirect.
 * * string: plain URL.
 * * object: route name {name: 'ROUTE'}.
 * * function: callback function fn(to) to resolve the redirect.
 * @property {string?} name name of the route.
 * @property {function} component svelte component.
 * @property {object} meta route meta.
 * @property {object} params route resolved params.
 * @property {boolean|object|function} props props passed to component.
 * * true: auto-resolve props from route params.
 * * object: pass this object directly to component as props.
 * * function: callback function to resolve props from route object.
 */

/**
 * Create route record.
 * @param {module:svelte-router/route~Config} route Matching route config.
 * @param {string[]|object} params Regex exec output or params object.
 * @return {module:svelte-router/route~Record}
 */
export function createRouteRecord(route, params) {
  const record = {
    path: route.path,
    redirect: route.redirect,
    name: route.name,
    component: route.component,
    meta: route.meta,
    props: route.props,
    params: {},
  };

  // Regex array setter
  let setParamValue = (key, collection, index) => {
    index++;
    if (index < params.length) {
      collection[key] = params[index];
    }
  };

  // Object setter
  if (tc.isObject(params)) {
    setParamValue = (key, collection, index) => {
      if (tc.not.isNullOrUndefined(params[key])) {
        collection[key] = params[key];
      }
    };
  }

  // Params
  for (let i = 0; i < route.paramKeys.length; i++) {
    setParamValue(route.paramKeys[i].name, record.params, i);
  }

  return record;
}

/**
 * Route object.
 * @typedef Route
 * @property {string} name name of the route.
 * @property {string} path location path use to resolve the route.
 * @property {string|object|function} redirect route redirect.
 * * string: plain URL.
 * * object: route name {name: 'ROUTE'}.
 * * function: callback function fn(to) to resolve the redirect.
 * @property {string} hash url hash.
 * @property {string} fullPath the full resolved URL including query and hash.
 * @property {object} params params object used to resolve the path params.
 * @property {object} query query parameters.
 * @property {module:svelte-router/history~HISTORY_ACTION} action route action.
 * @property {module:svelte-router/route~Record[]} matched resolved
 * route records.
 */

/**
 * Create route object.
 * @param {module:svelte-router/location~Location} location triggered location.
 * @param {module:svelte-router/route~Record[]} matches collection of
 * matched route records.
 * @return {module:svelte-router/route~Route}
 */
export function createRoute(location, matches) {
  // Get the last route in the stack as the resolved route
  const route = matches[matches.length-1];
  return {
    name: route.name,
    action: location.action,
    path: location.path,
    redirect: route.redirect,
    hash: location.hash,
    fullPath: fullURL(location.path, location.query, location.hash),
    params: route.params,
    query: location.query,
    meta: route.meta,
    matched: matches,
  };
};

/**
 * Deep clone route.
 * @param {module:svelte-router/route~Route} route source route.
 * @return {module:svelte-router/route~Route}
 */
export function cloneRoute(route) {
  if (route == null) {
    return {};
  }
  const clone = deepClone(route);
  clone.redirect = route.redirect;
  for (let i = 0; i < route.matched.length; i++) {
    clone.matched[i].component = route.matched[i].component;
    clone.matched[i].props = route.matched[i].props;
    clone.matched[i].meta = route.matched[i].meta;
    clone.matched[i].redirect = route.matched[i].redirect;
  }
  return clone;
}
