import {
  createRouteConfig,
  createRouteRecord,
  RouteConfigPrefab,
  RouteConfig,
  createRoute
} from '../src/route';
import { HISTORY_ACTION } from '../src/history';

test('createRouteConfig', () => {
  const invalid = [
    {
      test: undefined,
      error: 'invalid route config prefab'
    },
    {
      test: {},
      error: 'invalid route config path property'
    },
    {
      test: {path: 4},
      error: 'invalid route config path property'
    },
    {
      test: {path: '/valid', component: 4},
      error: 'invalid route config component property'
    },
    {
      test: {path: '/valid', meta: 4},
      error: 'invalid route config meta property'
    },
    {
      test: {path: '/valid', redirect: 4},
      error: 'invalid route config redirect property'
    },
    {
      test: {path: '/valid', props: 4},
      error: 'invalid route config props property'
    },
  ];
  const tests = [
    // Minimal route
    {
      test: {
        path: '/homepage',
        children: [],
      },
      result: {
        path: '/homepage',
      }
    },
    // Async
    {
      test: {
        path: '/homepage',
        children: [],
        component: new Promise(() => {}),
      } as RouteConfigPrefab,
      result: {
        path: '/homepage',
        async: true,
      }
    },
  ];
  for (const t of invalid) {
    expect(() => {createRouteConfig(t.test as RouteConfigPrefab)}).toThrow(t.error);
  }
  for (const t of tests) {
    expect(createRouteConfig(t.test)).toMatchObject(t.result)
  }
});

test('createRouteRecord', () => {
  const tests = [
    {
      route: {
        id: Symbol('Route ID'),
        path: '/homepage',
        async: false,
        parent: null,
        paramKeys: [],
        matcher: /.*/,
        generator: () => '',
        children: [],
      } as RouteConfig,
      params: [],
      result: {
        path: '/homepage',
        params: {},
        meta: undefined,
        props: undefined,
      }
    },
    // Object params
    {
      route: {
        id: Symbol('Route ID'),
        path: '/homepage',
        async: false,
        parent: null,
        paramKeys: [{
          name: 'id',
        }],
        matcher: /.*/,
        generator: () => '',
        children: [],
      } as RouteConfig,
      params: {
        id: 5,
        unknown: 10,
      },
      result: {
        path: '/homepage',
        params: {
          id: 5,
        },
        meta: undefined,
        props: undefined,
      }
    },
    // Param list
    {
      route: {
        id: Symbol('Route ID'),
        path: '/homepage',
        async: false,
        parent: null,
        paramKeys: [{
          name: 'id',
        }],
        matcher: /.*/,
        generator: () => '',
        children: [],
      } as RouteConfig,
      params: ['', '5'],
      result: {
        path: '/homepage',
        params: {
          id: 5,
        },
        meta: undefined,
        props: undefined,
      }
    }
  ];

  for (const t of tests) {
    expect(createRouteRecord(t.route, t.params)).toMatchObject(t.result);
  }
});

test('createRoute', () => {
  const tests = [
    {
      location: {
        action: HISTORY_ACTION.PUSH,
        path: '/homepage',
        query: {
          msg: 'welcome'
        },
        params: {},
        hash: 'welcome'
      },
      matches: [
        {
          id: Symbol(),
          path: '/',
          component: false,
          async: false,
          params: {},
          name: 'FIRST',
        },
        {
          id: Symbol(),
          path: '/',
          component: false,
          async: false,
          params: {},
          name: 'LAST',
        }
      ],
      result: {
        name: 'LAST',
        fullPath: '/homepage?msg=welcome#welcome'
      }
    }
  ];

  for (const t of tests) {
    expect(createRoute(t.location, t.matches)).toMatchObject(t.result);
  }
});
