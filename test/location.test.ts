import {HISTORY_ACTION} from '../src/history';
import {createLocation} from '../src/location';

test('createLocation', () => {
  const invalid = [
    [
      {
        path: '/path?dsa?',
        hash: '',
        query: null,
        params: undefined,
        replace: false,
      }
    ],
  ];

  const tests = [
    [
      {
        path: '/path',
        hash: '',
        query: null,
        params: undefined,
        replace: false,
      }, {
        path: '/path',
        hash: '',
        query: {},
        params: {},
        action: HISTORY_ACTION.PUSH,
      }
    ],
    [
      {
        path: '/path',
        hash: '#anchor-value',
        query: null,
        params: undefined,
        replace: false,
      }, {
        path: '/path',
        hash: 'anchor-value',
        query: {},
        params: {},
        action: HISTORY_ACTION.PUSH,
      }
    ],
    [
      {
        path: '/path',
        hash: '',
        query: null,
        params: {param: 'value'},
        replace: false,
      }, {
        path: '/path',
        hash: '',
        query: {},
        params: {param: 'value'},
        action: HISTORY_ACTION.PUSH,
      }
    ],
    [
      {
        name: 'ROUTE_NAME',
        path: '/path',
        hash: '',
        query: {param: 'value'},
        params: undefined,
        replace: false,
      }, {
        name: 'ROUTE_NAME',
        path: '/path',
        hash: '',
        query: {param: 'value'},
        params: {},
        action: HISTORY_ACTION.PUSH,
      }
    ],
  ];

  for (const t of invalid) {
    expect(() => {createLocation(t[0])}).toThrow(/invalid URL.*/);
  }
  for (const t of tests) {
    expect(createLocation(t[0])).toEqual(t[1]);
  }
});
