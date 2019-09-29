/**
 * Svelte Router utilities module.
 * @module svelte-router/utils
 */

import tc from '@spaceavocado/type-check';

/**
 * String has prefix predicate.
 * @param {string} s tested string.
 * @param {string} prefix needle.
 * @return {boolean}
 */
export function hasPrefix(s: string, prefix: string): boolean {
  if (prefix.length == 0 || s.length == 0) {
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
 * String has suffix predicate.
 * @param {string} s tested string.
 * @param {string} suffix needle.
 * @return {boolean}
 */
export function hasSuffix(s: string, suffix: string): boolean {
  if (suffix.length == 0 || s.length == 0) {
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
 * Trim prefix
 * @param {string} s tested string.
 * @param {string} prefix needle.
 * @return {string}
 */
export function trimPrefix(s: string, prefix: string): string {
  if (prefix.length > 0 && hasPrefix(s, prefix)) {
    return s.substr(prefix.length);
  }
  return s;
}

/**
 * Join URL paths.
 * @param {string} a URL path A.
 * @param {string} b URL path B.
 * @return {string}
 */
export function joinPath(a: string, b: string): string {
  const aSlash = hasSuffix(a, '/');
  const bSlash = hasPrefix(b, '/');
  if (aSlash && bSlash) {
    return a + b.slice(1);
  }
  if (!aSlash && !bSlash) {
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
export function urlMatch(a: string, b: string): boolean {
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
 * URL prefix predicate
 * @param {string} haystack URL haystack.
 * @param {string} prefix URL prefix.
 * @throws an error if the URL is not valid.
 * @return {boolean}
 */
export function urlPrefix(haystack: string, prefix: string): boolean {
  if (haystack.length == 0 || prefix.length == 0) {
    return false;
  }
  if (hasPrefix(haystack, '/') == false) {
    haystack = `/${haystack}`;
  }
  if (hasPrefix(prefix, '/') == false) {
    prefix = `/${prefix}`;
  }
  return hasPrefix(haystack, prefix);
}

/**
 * Parsed URL object.
 */
interface ParsedURL {
  /** URL base path without query or hash */
  base: string;
  /** Query params */
  query: {[k: string]: string};
  /** Hash string */
  hash: string;
}

/**
 * Extract query param and hash from URL and return
 * the base URL, dictionary of query params, and the hash.
 * @param {string} path full URL.
 * @throws an error if the URL is not valid.
 * @return {ParsedURL}
 */
export function parseURL(path: string): ParsedURL {
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

  const result: ParsedURL = {
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
 * @param {string} path URL base path without query or hash.
 * @param {object?} query query param dictionary.
 * @param {string} hash hash param.
 * @return {string}
 */
export function fullURL(
    path: string,
    query: {[k: string]: string} | null | undefined,
    hash: string): string {
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
 * History location object
 */
export interface HistoryLocation {
  /** A unique string representing this location. */
  key: string;
  /** The path of the URL. */
  pathname: string;
  /** The URL query string. */
  search: string;
  /** The URL hash fragment. */
  hash: string;
  /** Extra state for this location. */
  state: string;
}

/**
 * Get full URL from the history location object.
 * @param {HistoryLocation} location history location objec.
 * @return {string}
 */
export function historyFullURL(location: HistoryLocation): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

/**
 * Simple object deep clone.
 * @param {object} o source object.
 * @return {object}
 */
export function deepClone(o: object): object {
  if (tc.isNullOrUndefined(o) || tc.not.isObject(o)) {
    return {};
  }
  return JSON.parse(JSON.stringify(o));
}
