# Jsonizer Changelog

## 3.0.0

* Upgrade `typescript` and `ts-node`
* **Breaking change** : simplification of `Mappers` : the `Match` type parameter is no longer necessary, ranges and Regexp matchers can be safely set within mapping entries.

-----

### 2.1.0

* Include abstract class in type definition
* Generate dynamic class for custom `Error`s
* Handle `null` in built-in revivers

### 2.0.1

* Bug fix: empty keys elsewhere than on the root when running `JSON.stringify()` were causing a failure

## 2.0.0

* **Breaking change** : `[Jsonizer.toJSON]()` was a replacement of `.toJSON()` when using `JSON.stringify()` ; now you have to opt-in to Jsonizer's behaviour by passing a replacer : using Jsonizer's replacer already works (since this is expected), but `JSON.stringify(data)` have to be replaced by `JSON.stringify(data, Jsonizer.REPLACER)` if you want to apply the custom `[Jsonizer.toJSON]()` functions available.
* Changing Jsonizer's internal namespace to `npm:@badcafe/jsonizer`
* Documentation improvement

## 1.0.0

First public release
