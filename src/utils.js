/**
 * Svelte Router utilities module.
 * @module svelte-router/utils
 */

import tc from '@spaceavocado/type-check';

/**
 * String has suffix predicate.
 * @param {string} s tested string.
 * @param {string} suffix needle.
 * @return {boolean}
 */
export function hasSuffix(s, suffix) {
  if (tc.isNullOrUndefined(s)
    || tc.isNullOrUndefined(suffix)
    || tc.not.isString(s)
    || tc.not.isString(suffix)) {
    return false;
  }
  if (suffix.length <= s.length) {
    if (s.slice(-1 * suffix.length) == suffix) {
      return true;
    }
  }
  return false;
}

/**
 * String has prefix predicate.
 * @param {string} s tested string.
 * @param {string} prefix needle.
 * @return {boolean}
 */
export function hasPrefix(s, prefix) {
  if (tc.isNullOrUndefined(s)
    || tc.isNullOrUndefined(prefix)
    || tc.not.isString(s)
    || tc.not.isString(prefix)) {
    return false;
  }
  if (prefix.length <= s.length) {
    if (s.slice(0, prefix.length) == prefix) {
      return true;
    }
  }
  return false;
}

/**
 * Join URL paths.
 * @param {string} a URL path A.
 * @param {string} b URL path B.
 * @return {string}
 */
export function joinPath(a, b) {
  if (tc.isNullOrUndefined(a)
    || tc.isNullOrUndefined(b)
    || tc.not.isString(a)
    || tc.not.isString(b)) {
    return '';
  }
  const aslash = hasSuffix(a, '/');
  const bslash = hasPrefix(b, '/');
  if (aslash && bslash) {
    return a + b.slice(1);
  }
  if (!aslash && !bslash) {
    return a + '/' + b;
  }
  return a + b;
}

/**
 * URL match predicate
 * @param {string} a URL a.
 * @param {string} b URL b.
 * @throws an error if the URL is not valid.
 * @return {boolean}
 */
export function urlMatch(a, b) {
  if (tc.isNullOrUndefined(a) || tc.not.isString(a)
  || tc.isNullOrUndefined(b) || tc.not.isString(b)) {
    return false;
  }
  let sections = a.split('?');
  if (sections.length > 2) {
    throw new Error('invalid URL');
  }
  a = sections[0];
  sections = b.split('?');
  if (sections.length > 2) {
    throw new Error('invalid URL');
  }
  b = sections[0];

  if (hasPrefix(a, '/') == false) {
    a = `/${a}`;
  }
  if (hasSuffix(a, '/') == false) {
    a = `${a}/`;
  }
  if (hasPrefix(b, '/') == false) {
    b = `/${b}`;
  }
  if (hasSuffix(b, '/') == false) {
    b = `${b}/`;
  }

  return a == b;
}

/**
 * Parsed URL object.
 * @typedef ParsedURL
 * @property {string} base URL base.
 * @property {object} query query params.
 * @property {string} hash url hash.
 */

/**
 * Extract query param and hash from URL and return
 * the base URL, dictionary of query params, and the hash.
 * @param {string} path full URL.
 * @throws an error if the URL is not valid.
 * @return {svelte-router/utils.ParsedURL}
 */
export function parseURL(path) {
  let hash = '';
  let sections = path.split('#');

  if (sections.length > 2) {
    throw new Error('invalid URL');
  } else if (sections.length == 2) {
    path = sections[0];
    hash = sections[1];
  }
  sections = path.split('?');
  if (sections.length > 2) {
    throw new Error('invalid URL');
  }

  const result = {
    base: sections[0],
    query: {},
    hash: hash,
  };

  if (sections.length == 2) {
    const entries = sections[1].split('&');
    for (const entry of entries) {
      const keyValue = entry.split('=');
      result.query[keyValue[0]] = keyValue[1];
    }
  }

  return result;
}

/**
 * Get full URL from the base URL, query object, and hash.
 * @param {string} path base URL.
 * @param {object} query query param dictionary.
 * @param {string} hash hash param.
 * @return {string}
 */
export function fullURL(path, query, hash) {
  let queryPath = '';
  if (tc.not.isNullOrUndefined(query)) {
    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        if (queryPath.length > 0) {
          queryPath += '&';
        }
        queryPath += `${key}=${query[key]}`;
      }
    }
    if (queryPath.length > 0) {
      path = `${path}?${queryPath}`;
    }
  }
  if (hash.length > 0) {
    path = `${path}#${hash}`;
  }
  return path;
}

/**
 * Get full URL from the history location object.
 * @param {object} location
 * @param {string} location.pathname The path of the URL.
 * @param {string} location.key A unique string representing this location.
 * @param {string} location.hash The URL hash fragment.
 * @param {string} location.search The URL query string.
 * @param {string} location.state Extra state for this location.
 * @return {string}
 */
export function historyFullURL(location) {
  return `${location.pathname}${location.search}${location.hash}`;
}

/**
 * Simple object deep clone.
 * @param {object} o source object.
 * @return {object}
 */
export function deepClone(o) {
  if (tc.isNullOrUndefined(o) || tc.not.isObject(o)) {
    return {};
  }
  return JSON.parse(JSON.stringify(o));
}
