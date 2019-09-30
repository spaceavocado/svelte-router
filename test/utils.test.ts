import {
  hasPrefix,
  hasSuffix,
  trimPrefix,
  joinPath,
  urlMatch,
  urlPrefix,
  parseURL,
  fullURL,
  historyFullURL,
  deepClone,
  isWholeNumber,
  isFloatNumber,
} from  '../src/utils';

test('hasPrefix', () => {
  const tests: [string, string, boolean][] = [
    ['', '', false],
    ['a', '', false],
    ['', 'a', false],
    ['a', 'a', true],
    ['abc', 'a', true],
  ];
  for (const t of tests) {
    expect(hasPrefix(t[0], t[1])).toBe(t[2]);
  }
});

test('hasSuffix', () => {
  const tests: [string, string, boolean][] = [
    ['', '', false],
    ['a', '', false],
    ['', 'a', false],
    ['a', 'a', true],
    ['abc', 'c', true],
  ];
  for (const t of tests) {
    expect(hasSuffix(t[0], t[1])).toBe(t[2]);
  }
});

test('trimPrefix', () => {
  const tests = [
    ['', '', ''],
    ['a', '', 'a'],
    ['', 'a', ''],
    ['a', 'a', ''],
    ['abc', 'a', 'bc'],
    ['abc', 'abc', ''],
  ];
  for (const t of tests) {
    expect(trimPrefix(t[0], t[1])).toMatch(t[2]);
  }
});

test('joinPath', () => {
  const tests = [
    ['', '', ''],
    ['a', '', 'a/'],
    ['', 'b', '/b'],
    ['a', 'b', 'a/b'],
    ['a/', 'b', 'a/b'],
    ['a', '/b', 'a/b'],
    ['a/', '/b', 'a/b'],
  ];
  for (const t of tests) {
    expect(joinPath(t[0], t[1])).toMatch(t[2]);
  }
});

test('urlMatch', () => {
  const invalid = [
    ['/path?/?', ''],
    ['', '/path?/?'],
  ];
  const tests: [string, string, boolean][] = [
    ['/a', '', false],
    ['a', '/b', false],
    ['/a?s=term', '', false],
    ['a', '/b?s=term', false],
    ['/a', '/a', true],
    ['a', '/a', true],
    ['/a', 'a/', true],
    ['/a?s=term', '/a', true],
  ];
  for (const t of invalid) {
    expect(() => {urlMatch(t[0], t[1])}).toThrow('invalid URL');
  }
  for (const t of tests) {
    expect(urlMatch(t[0], t[1])).toBe(t[2]);
  }
});

test('urlPrefix', () => {
  const tests: [string, string, boolean][] = [
    ['', '', false],
    ['sample-page', '', false],
    ['', 'sample', false],
    ['sample-page', 'sample', true],
    ['sample-page', '/sample', true],
    ['/sample-page', 'sample', true],
  ];
  for (const t of tests) {
    expect(urlPrefix(t[0], t[1])).toBe(t[2]);
  }
});

test('parseURL', () => {
  const invalid = [
    ['/path#/#'],
    ['/path?/?'],
  ];
  const tests: [string, object][] = [
    ['/a', {base: '/a', hash: '', query: {}}],
    ['/a#anchor-link', {base: '/a', hash: 'anchor-link', query: {}}],
    ['/a?param=value', {base: '/a', hash: '', query: {param: 'value'}}],
    ['/a?parama=valuea&paramb=valueb', {base: '/a', hash: '', query: {parama: 'valuea', paramb: 'valueb'}}],
    ['/a?param=value#anchor-link', {base: '/a', hash: 'anchor-link', query: {param: 'value'}}],
  ];
  for (const t of invalid) {
    expect(() => {parseURL(t[0])}).toThrow('invalid URL');
  }
  for (const t of tests) {
    expect(parseURL(t[0])).toEqual(t[1]);
  }
});

test('fullURL', () => {
  const tests: [string, {[k: string]: string} | null | undefined, string, string][] = [
    ['/a', null, '', '/a'],
    ['/a', undefined, '', '/a'],
    ['/a', {}, '', '/a'],
    ['/a', {}, 'anchor-link', '/a#anchor-link'],
    ['/a', {param: 'value'}, '', '/a?param=value'],
    ['/a', {param: 'value'}, 'anchor-link', '/a?param=value#anchor-link'],
    ['/a', {parama: 'valuea', paramb: 'valueb'}, '', '/a?parama=valuea&paramb=valueb'],
  ];
  for (const t of tests) {
    expect(fullURL(t[0], t[1], t[2])).toMatch(t[3]);
  }
});

test('historyFullURL', () => {
  const tests: [object, string][] = [
    [{pathname: '/a', search: '', hash: ''}, '/a'],
    [{pathname: '/a', search: '', hash: '#anchor-link'}, '/a#anchor-link'],
    [{pathname: '/a', search: '?param=value', hash: ''}, '/a?param=value'],
    [{pathname: '/a', search: '?param=value', hash: '#anchor-link'}, '/a?param=value#anchor-link'],
  ];
  for (const t of tests) {
    expect(historyFullURL(t[0])).toMatch(t[1]);
  }
});

test('deepClone', () => {
  const a = {pathname: '/a', search: '', hash: ''};
  expect(deepClone(a)).not.toBe(a);
});

test('isWholeNumber', () => {
  const tests: [string, boolean][] = [
    ['', false],
    ['a', false],
    ['01', false],
    ['a3', false],
    ['3a', false],
    ['0', true],
    ['12', true],
    ['12.4', false],
  ];
  for (const t of tests) {
    expect(isWholeNumber(t[0])).toBe(t[1]);
  }
});

test('isFloatNumber', () => {
  const tests: [string, boolean][] = [
    ['', false],
    ['a', false],
    ['01', false],
    ['a3', false],
    ['3a', false],
    ['0', false],
    ['12', false],
    ['12.4.4', false],
    ['12.4', true],
  ];
  for (const t of tests) {
    expect(isFloatNumber(t[0])).toBe(t[1]);
  }
});
