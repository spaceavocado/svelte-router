import {
  Router,
} from '../src/router';
import { RouteConfigPrefab } from '../src/route';

test('basename', () => {
  expect(new Router({
    basename: 'service',
    routes: [],
  }).basename).toBe('/service');
});

test('routes', () => {
  const prefabs: RouteConfigPrefab[] = [
    { 
      path: '/',
      name: 'HOME',
    },
    { 
      path: '/articles',
      children: [
        {
          path: '',
          name: 'ARTICLES',
        },
        {
          path: '/:page(\\d+)',
          name: 'ARTICLES_PAGED',
          props: true,
        },
      ]
    },
    {
      path: '*',
    },
  ];
  const routes = new Router({routes: prefabs}).routes;
  expect(routes[0]).toMatchObject({
    name: 'HOME',
    path: '/',
  });
  expect(routes[1].children[0]).toMatchObject({
    name: 'ARTICLES',
    path: '/articles',
  });
  expect(routes[1].children[1]).toMatchObject({
    name: 'ARTICLES_PAGED',
    path: '/articles/:page(\\d+)',
    paramKeys: [
      {
        name: 'page',
        pattern: '\\d+'
      }
    ]
  });
  expect(routes[2]).toMatchObject({
    path: '*',
  });
});