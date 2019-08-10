# Svelte Router changelog

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
