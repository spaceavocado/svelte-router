# Svelte Router changelog

## 1.0.16

* Source code migrated into typescript.
* Props of number type, are automatically casted to numbers during the params to props auto resolving.

## 1.0.15

* Bugfix: links have active class on the page load in the URL matches.

## 1.0.14

* Minor fixtures.

## 1.0.13

* New feature: Lazy loaded view component (async components).

## 1.0.12

* Link component has not disabled prop, preventing the navigation action.

## 1.0.11

* Updated components.

## 1.0.9

* Build process converted to rollup for better ESM support.

## 1.0.8

* New feature: onBeforeNavigation router event.

## 1.0.7

* New feature: Route redirection.
* Router View component now supports the exact matching for active class.
* Bugfix: Navigation to root named route.

## 1.0.6

* Bugfix: Router properly handles basename passed as router config.

## 1.0.5

* The navigation is being skipped, if the request is to resolve the same route, respectively, the same full path URL.
* Resolved issue with re-drawn of the same view component.

## 1.0.4

* path-to-regexp downgrade for better dynamic params parsing - in this case, URLs.
* Router Link component CSS class prop added.

## 1.0.3

* Router components are now imported as source Svelte files to prevent runtime issues when the imported components unmount.

## 1.0.0

* First beta release
