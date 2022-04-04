# Jsonizer Changelog

## 6.0.0

* Fix bug in replacer with `undefined` values in an array.
* Change logo to support Ukraine
* Add method `Namespace.hasClass(qname)`
* Add method `Replacer.getMappers()`
* Expose optimization algorithms to public API
* **Breaking change** : Now if the captured reviver is empty, its string representation returns `null` instead of `undefined`, which can be turned to JSON and restored from JSON safely.

## 5.0.0

* Remove unused code + minor refacto
* **Breaking change** : The previous release v4.0.0 was bundled with the anterior version ! This is fixed in v5.0.0

-----

## 4.0.0

* Fix corner case issues of `Jsonizer.replacer()` when the target type is destructured to a different DTO.
    > The algorithm was drastically simplified.
* **Breaking change** : Now if the captured reviver is empty, its string representation returns `undefined` instead of `{}`. This let you get it anyway with `replacer.toString() ?? '{}'`?

-----

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

-----

## 1.0.0

First public release
