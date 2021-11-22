# Jsonizer Changelog

## 2.0.0

* **Breaking change** : `[Jsonizer.toJSON]()` was a replacement of `.toJSON()` when using `JSON.stringify()` ; now you have to opt-in to Jsonizer's behaviour by passing a replacer : using Jsonizer's replacer already works (since this is expected), but `JSON.stringify(data)` have to be replaced by `JSON.stringify(data, Jsonizer.REPLACER)` if you want to apply the custom `[Jsonizer.toJSON]()` functions available.
* Changing Jsonizer's internal namespace to `npm:@badcafe/jsonizer`
* Documentation improvement

## 1.0.0

First public release
