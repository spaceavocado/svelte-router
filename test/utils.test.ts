import {hasPrefix} from '../src/utils';
import {hasSuffix} from '../src/utils';
import {trimPrefix} from '../src/utils';
import {joinPath} from '../src/utils';
import {urlMatch} from '../src/utils';
import {urlPrefix} from '../src/utils';
import {parseURL} from '../src/utils';
import {fullURL} from '../src/utils';
import {historyFullURL} from '../src/utils';
import {deepClone} from  '../src/utils';

test('hasPrefix', () => {
  const tests = [
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
  const tests = [
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
  const tests = [
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
  const tests = [
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
  const tests = [
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
  const tests = [
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
  const tests = [
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