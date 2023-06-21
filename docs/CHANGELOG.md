# Jsonizer Changelog

### 8.1.1

* Rebuild

### 8.1.0

* A replacer can be called directly on a value without calling `JSON.stringify()`, e.g. `replacer('', data)`

### 8.0.4

* Bug fix: class rename didn't applied to instances.

### 8.0.3

* Namespace integrity can be checked without throwing an error.
* Deduplicates internal classes when the library is loaded several times.

### 8.0.2

* Allow to `.map()` array items to a reviver.
* Allow a reviver to handle both an array or an object.

### 8.0.1

* Bug fix: Maximum call stack size exceeded with weird hierarchy

## 8.0.0

* **Breaking change** : Custom errors are now in their own namespace `error` ; a name that ends with `Error` is no longer handled as an `Error`, except for Javascript standard errors. This change has no impact on existing applications except if a mapper of a custom error were **stored** with the old name ; in that case it should be renamed with the prefix `error.`, e.g. `error.MyError`.
* Bug fix: Namespace dynamics : On class rename or on relocating a namespace, children classes are following the new name.
* Adding `Namespace.checkIntegrity()` to ensure namespace consistency after everything is wired up.
* Including Asynchronizer tests.

-----

### 7.0.6

* Makes global objects global accross multiple library loads

### 7.0.5

* Fix typed parameter in function signature

### 7.0.3

* Fix webpack side effect : prevent cancelling the naming of dynamic class creation

### 7.0.2

* Bug fix: avoid a property of a mapper reading a value on `null`, protect other `typeof` being `null`

### 7.0.1

* Bug fix: allow to update a resolved mapper in its parent mapper (in the browser)

## 7.0.0

* Expose `mjs` (as the default) and `cjs` properly, to prevent `Attempted import error: 'Errors' is not exported from '@badcafe/jsonizer'` when module resolution result on importing `cjs` from a module (issue encountered in CRA v4).

-----

### 6.0.4

* Bug fix: prevent `undefined` being revived (typically on function arguments breakdown in independant parts)
* `pruneEmptyMappings()` optimization : `{ foo: {'.': 'Foo' } }` becomes `{ foo: 'Foo' }` 

### 6.0.3

* Bug fix: submapper gives Jsonizer.Self.Identity

### 6.0.2

* Mappers definition enhancement for array indexes.
* Bug fix: expect submapper of `"Foo"` to be `{".": "Foo"}`

### 6.0.1

* Fix packaging.

## 6.0.0

* Fix bug in replacer with `undefined` values in an array.
* Change logo to support Ukraine
* Add method `Namespace.hasClass(qname)`
* Add method `Replacer.getMappers()`
* Expose optimization algorithms to public API
* **Breaking change** : Now if the captured reviver is empty, its string representation returns `null` instead of `undefined`, which can be turned to JSON and restored from JSON safely.

-----

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
