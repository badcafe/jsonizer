# Jsonizer 

<div class="nopub" style='margin: 20px; padding: 20px; border: solid 3px'>
    <a href="http://badcafe.github.io/jsonizer">Published version of this page available HERE</a>
    <br/>
</div>

> **Easy nested instance reviving for JSON**

`@badcafe/jsonizer` <img style="float: right" src="matryoshka.svg" width="50%"/> is a [Typescript](https://www.typescriptlang.org/)/Javascript library that takes care of instances of classes in the hierarchy of your data structure when you use `JSON.stringify()` and `JSON.parse()`.

Jsonizer mainly supplies a class decorator (`@Reviver()`) that describes how to revive classes, and two helper functions (`Jsonizer.reviver()` and `Jsonizer.replacer()`).

Jsonizer can indifferently revive JSON data structures (arrays, objects) or class instances with recursively nested custom classes, third-party classes, built-in classes, or sub JSON structures (arrays, objects).

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/typescript-jsonizer-class-example?file=index.ts)

### License <!-- {docsify-ignore} -->

[MIT](https://github.com/badcafe/jsonizer/blob/master/LICENSE.txt)

### Install <!-- {docsify-ignore} -->

```bash
npm install @badcafe/jsonizer
```

### Usage <!-- {docsify-ignore} -->

```typescript
import { Jsonizer, Reviver, Replacer, Mappers, Namespace } from '@badcafe/jsonizer';
// then see examples below
```

If you intend to use `@Reviver` as a decorator set the relevant flag in `tsconfig.json` :

```json
"compilerOptions": {
    "experimentalDecorators": true
}
```

For other transpilers ([Babel](https://babeljs.io/)), please refer to the relevant documentation for activating decorators.

> Decorators are not mandatory: [there is an alternative, see below...](#no-decorator)

## Overview

### What are we talking about ? <!-- {docsify-ignore} -->

Let's start with a simple data structure :

```typescript
const person = {
    name: 'Bob',
    birthDate: new Date('1998-10-21')
}
person.birthDate.getFullYear();
// 1998
const personJson = JSON.stringify(person);
// {   "name":"Bob",
//     "birthDate":"1998-10-21T00:00:00.000Z"
// }
// store or send the data
```

So far so good. Let's try to get back the data structure without Jsonizer :

```typescript
// respawn the person
const personFromJson = JSON.parse(personJson);
personFromJson.birthDate.getFullYear();
// Uncaught TypeError: personFromJson.birthDate.getFullYear is not a function
// 😵  oh no ! it is broken
typeof personFromJson.birthDate;
// string
// 😡  wrong type !
```

Instead, let's use Jsonizer 😍

```typescript
// in Jsonizer, a reviver is made of field mappings
const personReviver = Jsonizer.reviver<typeof person>({
    birthDate: Date // 👈  we need a mapping only for this field
});
// pass our reviver as 2nd argument of JSON.parse() 👇
const personFromJson = JSON.parse(personJson, personReviver);
// bonus : 👆 personFromJson is typed !
personFromJson.birthDate.getFullYear();
// 1998
// 👍  expected value
typeof personFromJson.birthDate
// object
personFromJson.birthDate.constructor
// Date
// 👌  everything is fine
```

Above, `Jsonizer.reviver<typeof person>()` is parameterized with the target type ; since we have hardcoded data in this example, we are getting it with `typeof person`. In a real app, we would have -say- an interface `Person` and therefore we would use `Jsonizer.reviver<Person>()`. Using types enforce the mappings to describe fields that exist in the target data structure.

Only the fields that are not basic javascript types (array, object, number, string, boolean, null) have to be described by a mapping, made of the field name and its reviver. The `birthDate` field is the only field that requires a mapping, and its reviver is the one bound to the `Date` native function. Behind the scene, Jsonizer ships the `Date` function with its reviver, so nothing special have to be done. We will see later how to bind revivers to custom classes, third-party classes, and other built-in classes.

### Jsonizer features

* Jsonizer relies on standard `JSON.parse(text, reviver?)` and `JSON.stringify(value, replacer?, space?)` functions.
* Jsonizer **reifies the hierachy missing** when using the `reviver` or `replacer` functions. Jsonizer's mappers are **structural** and **recursive** : values are not examined, mappers are applied on matching structure hierarchy.
* Jsonizer's revivers can **augment the data** by performing the reverse operation of objects stringification with enough flexibility, so that classes are allowed to define their own `toJSON()` functions.
* Jsonizer field mapping facilities include the joker `'*'` to match any field, as well as Regexp for objects keys and ranges for arrays items.
* Jsonizer is **not intrusive** : you can define mappers for your own classes as well as for third-party classes.
* Jsonizer is for JSON, and doesn't handle `undefined`, functions, or symbols. It doesn't either handle circular references (because `JSON.stringify()` doesn't handle them), except if `toJSON()` get rid of them and that the builder function of Jsonizer's revivers recreate them.
* Jsonizer can spawn itself the revivers for general purpose stringification and parsing, that can be stored or sent with the data payload.
* Jsonizer takes care of class name conflicts by introducing a simple yet powerful namespace feature.
* Jsonizer is made in Typescript for Typescript, and thanks to the type system will help developers to design easily their mappings.
* Jsonizer works in the browser as well as server-side.

## Revivers mappings

In Jsonizer, a data structure can be **augmented** to typed data thanks to mappers. **Mappers** are plain objects that contain an entry for each field to augment.

### Objects

Let's define a type for the previous example. As a structural type system, Typescript allow us to describe the shape of our data :

```typescript
interface Person {
    name: string
    birthDate: Date
}
const personReviver = Jsonizer.reviver<Person>({ // 👈  revive a Person
    // Typescript will check the fields that you can map
    birthDate: Date
});
// the type of personFromJson is inferred and set to Person
const personFromJson = JSON.parse(personJson, personReviver);
// its name is left as-is (a string), but its birthDate is a Date instance 👍 
```

### Arrays

In the following example, we introduce the 'any' key `'*'` that matches any item of an array or any field of an object.

```typescript
const persons: Person[] = [
    {   name: 'Bob',
        birthDate: new Date('1998-10-21')
    },
    {   name: 'Alice',
        birthDate: new Date('2002-04-01')
    }
];
const personsJson = JSON.stringify(persons);
// store or send the data
```

We already have a definition for each person item of the array. Jsonizer allow to define simply the mapping of all items :

```typescript
const personsReviver = Jsonizer.reviver<Person[]>({ // 👈 revive an array of Person
    '*': { // 👈  a 'joker' entry for matching Any array item
        birthDate: Date
    }
});
const personsFromJson = JSON.parse(personsJson, personsReviver);
// its type 👆 is Person[]
```

### Nested mappings

Let's go on with a little more complex data structure, with arrays and nested objects :

```typescript
const person = {
    name: 'Bob',
    birthDate: new Date('1998-10-21'),
    hobbies: [
        {   hobby: 'programming',
            startDate: new Date('2021-01-01'),
        },
        {   hobby: 'cooking',
            startDate: new Date('2020-12-31'),
        },
    ]
}
const personJson = JSON.stringify(person);
// store or send the data
```

Like a person, a hobby also has a date, but what is important here is that the `hobbies` field is an array of hobby :

```typescript
const personReviver = Jsonizer.reviver<typeof person>({
    birthDate: Date,
    hobbies: { // begin the mappings for an array
        '*': { // begin the mappings for a single item
            startDate: Date
        }
    }
});
const personFromJson = JSON.parse(personJson, personReviver);
```

The thing to notice is that it is possible to define a mapping at each level in the hierarchy.

### Tuples

A tuple is an array with a fixed length and potentially different item types :

```typescript
type Employee = [Person, Date]; // 👈  our tuple type

const employee: Employee = [
    {   name: 'Bob',
        birthDate: new Date('1998-10-21')
    }, new Date('2010-06-01')
];

const employeeReviver = Jsonizer.reviver<Employee>({
    0: { // 👈  first tuple item
        birthDate: Date
    },
    1: Date  // 👈  second tuple item
});
```

We might define the reviver for an array of employees :

```typescript
const employeesReviver = Jsonizer.reviver<Employee[]>({ // 👈  Employee[] here
    '*': {
        0: {
            birthDate: Date
        },
        1: Date
    }
});
```

It is possible to mix the 'any' key `'*'` with numeric keys : in that case, `'*'` is just the mapper for all keys that are not matched by numeric keys.

## Classes

Jsonizer supplies the decorator function `@Reviver` that allows to bind easily some mappings to a class.

> You ought decorate your classes with `@Namespace` too if you intend to share your code in a lib ([more about that later in this doc](#namespaces)).

### Custom classes

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/typescript-jsonizer-class-example?file=index.ts)

In the following example, we introduce the 'self' key `'.'`. Unlike other entries, it is not bound to **a mapper** but to **a builder function** that is supposed to create a new instance of the expected class. The builder function takes as argument the object that contains the values parsed and mapped to their type. This means that below, the `birthDate` argument passed to the constructor is already a `Date` instance (because there is a mapping that had augmented it).

```typescript
@Reviver<Person>({ // 👈  bind the reviver to the class
    '.': ({name, birthDate}) => new Person(name, birthDate), // 👈  instance builder
    birthDate: Date
})
class Person {
    constructor( // all fields are passed as arguments to the constructor
        public name: string,
        public birthDate: Date
    ) {}
}

const person = new Person('Bob', new Date('1998-10-21'));
const personJson = JSON.stringify(person);

const personReviver = Reviver.get(Person); // 👈  extract the reviver from the class
const personFromJson = JSON.parse(personJson, personReviver);
// this is 👆 an instance of Person
```

> The **builder function** can be more complex than the one shown here ([see later](#the-3939-self-builder)).

We can also refer it for example in the list of employees of the previous example :

```typescript
const employeesReviver = Jsonizer.reviver<Employee[]>({ // 👈  Employee[] here
    '*': {
        0: Person, // 👈  we can refer a class decorated with @Reviver
        1: Date
    }
});
```

### Self apply

The use case above is a common pattern where all the arguments are passed to the constructor. Jsonizer supplies a builder that does the job :

```typescript
@Reviver<Person>({
    '.': Jsonizer.Self.apply(Person), // 👈  same instance builder as above
    birthDate: Date
})
class Person {
    constructor(
        public name: string,
        public birthDate: Date
    ) {}
}
```

> If some arguments are optional, then you certainly have to customize the builder. Be aware that during stringification, fields set to `undefined` will be skipped whereas fields set to `null` will be present in the JSON text.

### Self assign

There is another common pattern where the constructor is empty, and each field has to be populated with the incoming data. Jsonizer supplies once again a builder that does the job :

```typescript
@Reviver<Person>({
    '.': Jsonizer.Self.assign(Person), // 👈 assign each field to the new instance
    birthDate: Date
})
class Person {  // no constructor, fields have to be assigned one by one
    name?: string,
    birthDate?: Date
}
```

### Self endorse

Finally, to let the incoming data endorse the class, use :

```typescript
@Reviver<Person>({
    '.': Jsonizer.Self.endorse(Person), // 👈 plug the class to the instance
    birthDate: Date
})
class Person {
    name?: string,
    birthDate?: Date
}
```

> Be aware that this helper won't call the constructor, if any.

### No @ decorator

Either you don't want to activate decorators in your project, or you want to bind a reviver to third-party classes or built-in classes, it is still possible to use `Reviver` as a 'normal' function :

```typescript
class Person {
    constructor(
        public name: string,
        public birthDate: Date
    ) {}
}

Reviver<Person>({
    '.': ({name, birthDate}) => new Person(name, birthDate),
    birthDate: Date
})(Person) // 👈  apply it to the class = same effect as using it as a decorator
```

### Class with nested JSON

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/typescript-jsonizer-nested-example?file=index.ts)

```typescript
interface Hobby {
    hobby: string,
    startDate: Date
}

@Reviver<Person>({
    '.': Jsonizer.Self.apply(Person),
    birthDate: Date,
    hobbies: { // 👈 this is not different as the first examples
        '*': {
            startDate: Date
        }
    }
})
class Person {
    constructor(
        public name: string,
        public birthDate: Date,
        public hobbies?: Hobby[]
    ) {}
}
```

### Class with nested class

```typescript
@Reviver<Hobby>({
    '.': Jsonizer.Self.assign(Hobby),
    startDate: Date
})
class Hobby {
    hobby?: string,
    startDate?: Date
}

@Reviver<Person>({
    '.': Jsonizer.Self.apply(Person),
    birthDate: Date,
    hobbies: {
        '*': Hobby  // 👈  we can refer a class decorated with @Reviver
    }
})
class Person {
    constructor(
        public name: string,
        public birthDate: Date,
        public hobbies?: Hobby[]
    ) {}
}
```

### Pass through (Identity)

In any cases where you don't want a class but kept as-is the augmented data structure, you may create a pass-through class :

```typescript
interface Hobby {
    hobby?: string,
    startDate?: Date
}

@Reviver<Hobby>({
    '.': Jsonizer.Self.Identity, // 👈  won't create an instance of Hobby
    startDate: Date
})
class HobbyReviver implements Hobby {  // 👈  we won't have instances of that class
    hobby?: string,
    startDate?: Date
}

@Reviver<Person>({
    '.': Jsonizer.Self.apply(Person),
    birthDate: Date,
    hobbies: {
        '*': HobbyReviver // 👈  just stands for a reviver reference
    }
})
class Person {
    constructor(
        public name: string,
        public birthDate: Date,
        public hobbies?: Hobby[] // 👈  just a plain javascript object
    ) {}
}
```

Above, we are using `Jsonizer.Self.Identity` to left as-is the incoming augmented data, but any custom function that returns whatever expected is suitable.

> The previous pattern applies to abstract classes or classes with a private or protected constructor and also to recursive data structure, since only classes can handle recursive mappings in Jsonizer.
> Whenever you expect a different class, instead of the identity you may build your instances with such utility classes.

### Built-in revivers

As mentionned previously, a mapper can refer a class decorated with `@Reviver`:

* ```'*': Hobby  // 👈  user class ```
* ```birthDate: Date // 👈  javascript class ```

Jsonizer supplies revivers for few built-in classes :
* `Date`,
* `RegExp`,
* `Error`

Jsonizer's `Reviver` class has also its reviver, that allow **to revive a reviver** like any other class ([see below](#replacer)).

### Errors

Javascript doesn't serialize the type and the message of an error :

```javascript
JSON.stringify(new TypeError('Ooops !'));
// '{}'
// for a custom error, only its own fields will be serialized
```

However Javascript can display a string representation :

```javascript
String(new TypeError('Ooops !'));
// 'TypeError: Ooops !'
```

By default, Jsonizer will serialize that string representation (the class name followed by a colon followed by the message),
and will revive errors even if the error class is unknown. This is safe for exchanging errors between a server and a client for example,
since the custom fields may contain sensible data.
This allows to serialize and recreate errors that are neither controlled by Jsonizer or your app. For example when you fetch data from a database, your code is not necessarily aware of all the kind or errors supposed to be thrown (network error, DNS error, DB error, etc) : the more often you want the data, and catch any error.

```javascript
// opt-in to Jsonizer's serialization :
JSON.stringify(new TypeError('Ooops !'), Jsonizer.REPLACER);
// '"TypeError: Ooops !"'
```

`Error`'s reviver can be used to revive any error, and will create dynamically missing custom error classes if needed :

```typescript
// built-in errors:
const typeError = JSON.parse('"TypeError: Ooops !"', Reviver.get(Error))
typeError instanceof Error
// true
typeError.constructor
// [Function: TypeError]

// unknown errors:
const notFoundError = JSON.parse('"Not Found: Ooops !"', Reviver.get(Error))
notFoundError instanceof Error
// true
notFoundError.constructor
// [Function: Not Found]
```

Custom errors can of course be processed like any other classes and will be revived if the error class is known at runtime.

The following helper may be used to register a singleton class without defining it strictly and bind a reviver to it :

```typescript
const NotFoundError = Errors.getClass('Not Found', true, 404); // true to supply the same instance on every parsing
// a common practice is to have an error code :
Errors.getCode(notFoundError);
// 404
```

> `error` is the namespace for errors, hence the qualified name of an error has the form `error.Not Found` for example.

### The `'.'` (self) builder

When entering a builder, the argument passed is the incoming data structured augmented so far, but Jsonizer supplies more context : `this` is set to a stack of the data structure hierarchy.

* Data in the parent hierarchy are parsed but not yet augmented.
* Previous siblings data are already parsed **and augmented**.
* Next siblings data are parsed but not yet augmented.

(this is due to the bottom-up nature of `JSON.parse()`)

```typescript
// 💡 you should first examine the data just after
@Reviver<Person & { hireDate?: Date }>({
    '.': function({name, birthDate, hireDate}) { // 👈 a more complex builder
        // "this" is an array of the hierarchy (we have 3 levels):
        // root   = this[0]; // People[]
        // parent = this[1]; // People = { type, person }
        // self   = this[2]; // { name, birthDate, hireDate? }
        const selfIndex = this.length -1;
        const parentIndex = selfIndex -1; // = this.length -2
        if (this[parentIndex].type === 'employee') {
            return new Employee(name, birthDate, hireDate)
        } else {
            return new Person(name, birthDate);
        }
    },
    birthDate: Date,
    hireDate: Date // 👈 don't forget to augment this date
})
class Person {
    constructor(
        public name: string,
        public birthDate: Date
    ) {}
}
class Employee extends Person {
    constructor(
        name: string,
        birthDate: Date,
        public hireDate: Date // 👈 an employee...
    ) {
        super(name, birthDate);
    }
}
type People = {
    type: 'person'
    person: Person
} | {
    type: 'employee'
    person: Employee
}
const people: People[] = [ // 👈 the data are a mix of Person and Employee
    {   type: 'person',
        person: new Person('Bob', new Date('1998-10-21'))
    },
    {   type: 'employee'
        person: new Employee('Alice', new Date('2002-04-01'), new Date('2010-06-01'))
    }
]
```

> Above, since the indexes `selfIndex` and `parentIndex` used to extract the parent context are computed from `this.length`, this allow to be flexible enough to use that reviver even if the data were not an array of people. However, we suppose that a `Person` or an `Employee` is already built in the context of the `People` wrapper that has a `type` field.

Of course, there is also the possibility to define a reviver for `Employee`, but here we demonstrate that other (external) data are available when building a new instance.

## DTO

Sometimes you have a class, that has its own shape, and you want to send it (as JSON) with another shape. The data exchanged are called [DTO](https://en.wikipedia.org/wiki/Data_transfer_object), for Data Transfer Object.

### `toJSON()` and DTO

The mappers accept an additional type parameter for the DTO. By default, the type of the DTO source is the same as the target type, but Jsonizer allows to indicate a different type. Of course, this implies that the object serialization is not the default one performed by `JSON.stringify()` : javascript has a standard feature that allows to customize the serialization, by defining the [`toJSON()` function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#tojson_behavior) in such classes.

The important thing is that the Jsonizer's self builder function of a class (bound to `'.'`) has to be somewhat the reverse function of its `toJSON()` function.

```typescript
type PersonDTO = {
    name: [string, string]
    birthDate: string
}

//       Target   Source
//         👇        👇                the builder is the reverse fctn of toJSON()
@Reviver<Person, PersonDTO>({ //                   👇
    '.': ({name: [firstName, lastName], birthDate}) =>
                            new Person(firstName, lastName, new Date(birthDate))
})
class Person {
    constructor(
        public firstName: string,
        public lastName: string,
        public birthDate: Date
    ) {}
    toJSON(): PersonDTO { // 👈  toJSON() is the reverse function of the builder
        return {
            name: [this.firstName, this.lastName],
            birthDate: this.birthDate.toISOString().slice(0, 10)
        }
    }
}

const person = new Person('Bob', 'Morane', new Date('1998-10-21'));
const personJson = JSON.stringify(person);
// {   "name": ["Bob", "Morane"],
//     "birthDate": "1998-10-21"
// }
```

### Types ambivalence

If you examine the `Person` class **below**, you will see that the `birthDate` field is a `Date` instance. Its builder is a function that takes as argument the object with the fields that is supplied by `JSON.parse()` **after** each field has been augmented : unlike the previous example, the `birthDate` is augmented to a `Date` **before** passing it to the builder. This also works as long as the source type is the same as the target type : the builder can create a new instance of `Person` because the source types have been augmented. But in fact, the source **IS NOT** the strict description of the JSON structure : the `birthDate` is typed as a `Date` but it is a string.

> Jsonizer chooses to reflect the types that fit better to a DTO, rather than those that appear in the JSON structure (only objects, arrays, strings, numbers, booleans, and nulls), because finally, JSON is just a text representation. The motivation for this choice is that the more often, the source and target structure are described by the same type, and it's very natural to have the right types when creating new instances.

Thus, alternatively to the previous example, we may assume that the existing `Date` type is suitable for a "`DateDTO`" :

```typescript
type PersonDTO = {
    name: [string, string]
    birthDate: Date // 👈  revived in the builder
}

//       Target   Source
//         👇        👇                  a Date instance, because we have a mapper
@Reviver<Person, PersonDTO>({ //            👇
    '.': ({name: [firstName, lastName], birthDate}) =>
        new Person(firstName, lastName, birthDate),
    birthDate: Date                  //     👆
})                                   // ✅ Date instance expected
class Person {
    constructor(
        public firstName: string,
        public lastName: string,
        public birthDate: Date
    ) {}
    toJSON(): PersonDTO { // 👈  if we force the result to be a PersonDTO...
        return {
            name: [this.firstName, this.lastName],
            birthDate: this.birthDate
                .toISOString().slice(0, 10) as any as Date
        }                                   // 👆    ❌ ...we get a type mismatch
    }                                       // consequence of ambivalence
}                                           // but it's fine to use it too !
```

> Be aware that there is a little difference between the DTO structure and the pure JSON structure that will be converted to a JSON string ; that difference also applies to classes: DTOs still brings the information of the types (`Date`, `Person`, `Hobby`, etc) according to Typescript whereas they are pure javascript structures (made of objects, arrays, strings, numbers, booleans and nulls). Above, the `birthDate` field described in the `PersonDTO` type is a `Date`, but the date is serialized to a string ; however, since there is a mapper that transform that string to a `Date`, it can be passed as a `Date` argument to the constructor. DTOs are more a sort of 'in-between' description of fields that are really represented in JSON at the very end, but marked as typed data during parsing.

### Mappers for Sub-DTO

The mappers are described by a plain object of the type `Mappers<Target, Source>`. When using `@Reviver<Target, Source>()` or `Jsonizer.reviver<Target, Source>()`, in fact you pass a recursive mappers structure.

At the top level, it is easy to specify the target and the source as shown before, but within nested structure, Jsonizer doesn't have enough informations to expose the right mappers fields. In that case, it is possible to enforce the types by explicitely set the submappers's type (this is not so different than using "pass-through" utility classes) :

```typescript
interface Hobby {
    hobby: string,
    startDate: Date
}
type HobbyDTO = [string, Date];
const hobbiesMapper: Mappers<HobbyDTO[]> = { // 👈  Source = Target
    '*': {
        1: Date
    }
}

type PersonDTO = {
    name: [string, string]
    birthDate: Date
    hobbies: HobbyDTO[]
}

//       Target   Source
//         👇        👇
@Reviver<Person, PersonDTO>({
    '.': ({name: [firstName, lastName], birthDate, hobbies}) =>
        new Person(firstName, lastName, birthDate,
            // map the HobbyDTO tuple to Hobby object
            hobbies.map(([hobby, startDate]) => ({ hobby, startDate }))),
    birthDate: Date,
    hobbies: hobbiesMapper
})
class Person {
    constructor(
        public firstName: string,
        public lastName: string,
        public birthDate: Date,
        public hobbies: Hobby[]
    ) {}
    toJSON(): PersonDTO {
        return {
            name: [this.firstName, this.lastName],
            birthDate: this.birthDate
                .toISOString().slice(0, 10) as any as Date,
            // map each Hobby objects to a HobbyDTO tuple
            hobbies: this.hobbies.map(({ hobby, startDate }) =>
                [hobby, startDate.toISOString().slice(0, 10) as any as Date])
        }
    }
}
```

Alternatively, instead of mapping `HobbyDTO` to `Hobby` in the person's builder, we can create a `Hobby` builder, and cast it accordingly in the person's builder.

```typescript
const hobbiesMapper: Mappers<Hobby[], HobbyDTO[]> = { // 👈  Source ≠ Target
    '*': {
        '.': ([hobby, startDate]) => ({ hobby, startDate }), // 👈  change the shape
        1: Date
    }
}

@Reviver<Person, PersonDTO>({
    '.': ({name: [firstName, lastName], birthDate, hobbies}) =>
        new Person(firstName, lastName, birthDate,
            hobbies as any as Hobby[]), // 👈  change the type accordingly
    birthDate: Date,
    hobbies: hobbiesMapper
})
```

### Reviving third-party classes and built-in classes

Just use `Reviver` as a normal function :

```typescript
type BufferDTO = ReturnType<typeof Buffer.prototype.toJSON>

Reviver<Buffer, BufferDTO>({
    '.': ({data}) => Buffer.from(data)
})(Buffer); // 👈  apply it to built-in or third-party classes

const buf = Buffer.from('ceci est un test');
const bufJson = JSON.stringify(buf);
// {   "type":"Buffer",
//     "data":[99,101,99,105,32,101,115,116,32,117,110,32,116,101,115,116]
// }
```

Revive it as usual :

```typescript
const bufFromJson = JSON.parse(bufJson, Reviver.get(Buffer));
```

### `[Jsonizer.toJSON]`

In certain circumstances you want to left as-is the original `toJSON()` method of an existing class, so that existing code won't break. However, if you still want a customize serialization when using `JSON.stringify()`, you may instead define the method `[Jsonizer.toJSON]()` :

```typescript
declare global {
    interface Buffer {
        [Jsonizer.toJSON](): any
    }
}
Buffer.prototype[Jsonizer.toJSON] = function() { // 👈  plug our custom function
    return [...this.values()]
}

Reviver<Buffer, number[]>({
    '.': values => Buffer.from(values)
})(Buffer);

const buf = Buffer.from('ceci est un test');
const bufJson = JSON.stringify(buf, Jsonizer.REPLACER); // 👈  pass a Jsonizer's replacer
// [99,101,99,105,32,101,115,116,32,117,110,32,116,101,115,116]
```

> You must explicitely opt-in to `[Jsonizer.toJSON]()` by using a
> Jsonizer's replacer :
> * `Jsonizer.REPLACER` (in the example above)
> * or `Jsonizer.replacer()` ([see below](#replacer))

### Fixing a bad structure

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/typescript-jsonizer-dto-example?file=index.ts)

Sometimes, you receive external data that are not well designed :

```typescript
const person = {
    first_name: 'Bob',                    // 👈  inconsistent field name
    numberOfHobbies: '3',                 // 👈  should be a number
    birthDate: '21/10/1998',              // 👈  formatted Date
    hobbies: 'cooking,skiing,programming' // 👈  not JSON-friendly
}
```

But you prefer a clean target structure...

```typescript
export interface Person { // 👈  Target with clean types
    firstName: string
    numberOfHobbies: number
    birthDate: Date
    hobbies: string[]
}
```

Just use a reviver to fix anything :

```typescript
// as a bonus, we introduce a namespace (more about that later)
export namespace Person {
    export interface DTO { // 👈  Source with bad types
        first_name?: string
        numberOfHobbies: string
        birthDate: string
        hobbies: string
    }

    export const reviver = Jsonizer.reviver<Person, Person.DTO>({
        '.': ({ first_name, ...otherProps }) => {
            return {
                //  👇 rename the field
                firstName: first_name,
                ...otherProps
            }
        },
        numberOfHobbies: {
            //  👇 fix the type
            '.': n => parseInt(n)
        },
        birthDate: {
            //  👇 fix the Date
            '.': date => {
                const [day, month, year] = date.split('/')
                    .map(part => parseInt(part));
                // don't use new Date(year, month - 1, day)
                // because it may shift due to the local time zone
                return new Date(Date.UTC(year, month - 1, day));
            }
        },
        hobbies: {
            //  👇 split CSV to array
            '.': csv => csv.split(',')
        }
    })
}
```

## Ranges and Regexp

So far, the mappers object of a **target object** could contain entries that are either the field names of the target object or `'*'` plus the special `'.'` entry for the builder. There is another possibility, using a string representation of a regular expression in order to match some fields name, e.g. `'/\\w+Date/'` to match fields name that ends with 'Date'.

Similarly, the mappers object of a **target array** could be extended to a range of indexes, e.g. `'8-12'` to match indexes between 8 and 12 (included).

### Regexp

> RegExp keys are represented as strings, which may introduce additional escapes, e.g. `/\w+Date/.toString()` gives `'/\\w+Date/'`

```typescript
//       Target
//         👇
@Reviver<Hobby>({
    '.': Jsonizer.Self.apply(Hobby),
    '/\\w+Date/': Date // 👈 matches any field that ends with 'Date'
})
class Hobby {
    constructor(
        public hobby: string,
        public startDate: Date,
        public endDate: Date,
        public lastDate: Date
    ) {}
}
```

Note that a similar result could be achieved with the following mappings:

```typescript
@Reviver<Hobby>({
    '.': Jsonizer.Self.apply(Hobby),
    '*': Date // 👈 matches any field...
    hobby: Jsonizer.Self.Identity // 👈  ...except 'hobby', kept unchanged
})
```

A mapper applies the following priority to a property name or an index:

1. exact name match,
2. RegExp match or range match ([see after](#ranges)),
3. any match (`'*'`) if present

otherwise, there is no mapping : the value is kept as-is.

### Ranges

```typescript
//     👇  the JSON structure is a tuple
type CarDTO = [Wheel, Wheel, Wheel, Wheel, Engine];

//     Target Source
//       👇     👇
@Reviver<Car, CarDTO>({
    '.': ([w1, w2, w3, w4, e]) => new Car(e, w1, w2, w3, w4),
    '0-3': Wheel, // 👈 matches the four first items
    4: Engine // 👈  we could use '*' for the rest
})
class Car {
    wheels: Wheel[];
    constructor(
        public engine: Engine,
        ...wheels: Wheel[]
    ) {
        if (wheels.length !== 4) {
            throw new Error(`A car must have 4 wheels ; found ${wheels.length}`);
        }
        this.wheels = wheels;
    }
    toJSON() {
        return [...this.wheels, this.engine]; // 👈  jsonify as an array
    }
}
```

## Namespaces

Classes have their own identity. Several classes may have the same name in certain circumstances :

* when their scope don't overlap (shadowing)
* when they are imported under a different name (which doesn't affect their internal name)

In both cases, the proper name of a class is not enough to distinguish classes in a higher scope, where Jsonizer works. This is where namespaces can help.

> Javascript and Typescript can group items together under namespaces, which lead roughly to a hierarchy of objects, but the items themselves when they are classes don't have the knowledge of the hierarchy they belong to. The purpose of Jsonizer's namespaces is to let classes knowing their fully qualified name.

A namespace aims to group related items under a universal naming system (for names that are supposed to be shared, typically when writing a library), or to a local name (for names that are not supposed to be reused, typically within an application).

### Choosing a namespace

* We suggest to left in the default namespace `''` (no namespace) the built-in classes of the Javascript language. This means that if you want to name a class that already has such name, or if you want to use a class of a third-party library that already has such name, that classes have to be set in a namespace.

* For a library of your own, it is strongly recommended to use a universal naming system. We suggest to use the reverse DNS name of your company / organization as the base name, e.g. `com.example.myLib`, or even the repo where it is published, e.g. `com.github.myLib`, or the name under which you published it in npm, e.g. `npm:@example/myLib`, or `npm:myLib`.

* For an app of your own, since nothing is designed to be exposed to others, a relative name such as `myApp` is enough.

* Jsonizer's own namespace is `npm:@badcafe/jsonizer` and **must not** be used for other material than those available in this library.
* Errors have also their own namespace which is `error` and will be used automatically for any custom error that has no user defined namespace. It **must not** be used for classes that don't inherit `Error`.

### Jsonizer namespaces

A namespace is mandatory for example to refer 2 classes with the same name, e.g. `Category` (of a product) and `Category` (of a movie). To be precise, a class decorated with `@Reviver` should be decorated with `@Namespace` (in any order), although Jsonizer namespaces might be also useful outside of the context of Jsonizer.

A namespace has to be unique within an application, therefore classes that are designed to be exposed in a library should be decorated with a universal unique namespace, e.g. `org.example.myLib`. Conversely, it is enough for a standalone application to group subordinate classes together using relative namespaces.

* using a universal unique namespace identifier :
``` typescript
@Namespace('org.example.myLib')
class Foo {}
   // 👆 qualified name set to 'org.example.myLib.Foo'
```

* using relative namespaces :
```typescript
@Namespace(Product)
class Category {}
   // 👆 qualified name set to 'Product.Category'
// and in a separate file :
@Namespace(Movie)
class Category {}
    // 👆 qualified name set to 'Movie.Category'
```

In the example above, even if an app imports 2 classes with the same name `Product`, it is still possible to relocate one (or both) of them :

```typescript
import { Product as Product1 } from './myApp';
import { Product as Product2 } from 'someLib';

Namespace('org.example.myApp')(Product1)
    // qualified name               👆
    // set to 'org.example.myApp.Product' 

Namespace('com.example.products')(Product2)
    // qualified name                  👆
    // set to 'com.example.products.Product' 
```

By transitivity, the Category is relocated to `org.example.myApp.Product.Category`

#### When Jsonizer is using namespace ?

The more often, you don't have to take care of namespaces, but if you expose your classes in a library, this is your responsability. Don't let the users of your library set themselves a namespace to your classes.

Jsonizer use namespaces when revivers are sent aside the data to revive. A stringified reviver lost the class identity to which it belongs, that can be recover only thanks to namespaces.

**Jsonizer will throw an error you when 2 revivers are bound to classes with the same qualified name.** Since during namespace settings some namespaces might overlap temporarily, such error can be thrown only at runtime. However, when you are sure that everything is wired up, you can check the integrity of the namespace registry :

```typescript
Namespace.checkIntegrity();
```

...yields tuples of [qualified name, class] present in the registry ; throws an error if 2 classes have the same qualified name. Note that a namespace defined with a string is different of a namespace defined with a class of the same name.

If namespace consistency is not checked after everything is wired up, you might encountered errors later when your app is up. It is recommended to call it after the setup of your app is done.

> Within revivers, **never write mappers with qualified names**, e.g.
> ```typescript
> @Reviver<Category>({
>     category: 'org.example.myApp.Product.Category' // 👎  don't write that
> }
> ```
> if the class is relocated, that mapping will not be found ; instead, write mappers with class references, e.g.
> ```typescript
> @Reviver<Category>({
>     category: Category // 👍 referred regardless of its namespace
> }
> ```
> The qualified names will be used by Jsonizer **only** when serializing revivers at the latest stage.

#### Summary

Usage as a decorator :

```typescript
@Namespace('org.example.myApp')
class Foo {}
    // 👆 qualified name set to 'org.example.myApp.Foo'

// setting a relative namespace :
@Namespace(Foo)
class Bar {}
    // 👆 qualified name set to 'org.example.myApp.Foo.Bar'

class Baz {}

@Namespace(Baz)
class Qux {}
    // 👆 qualified name set to 'Baz.Qux'
```

Usage as a function :

```typescript
// setting a namespace to an existing class :
import { Quux } from 'quuxLib';
Namespace('org.example.myApp')(Quux)
                             // 👆 qualified name set to
                             // 'org.example.myApp.Quux'

// relocating a class
Namespace('org.example.myApp')(Baz)
                             // 👆 qualified name set to
                             // 'org.example.myApp.Baz'
// and incidentally, Qux subordinate qualified name
//                       set to 'org.example.myApp.Baz.Qux'
```

### Typescript namespaces

Although Jsonizer's namespaces are unrelated to Typescript's namespaces, it is a good practice to organize your library or your app by grouping subordinate materials under a namespace, and apply Jsonizer's namespace as a layer above.

To recall the previous examples, we consider that a person's hobby is a concept strongly related to, well, a person, therefore we prefer naming it `Person.Hobby`. Other direct subordinate materials are also chained : `Person.DTO`, `Person.Hobby.DTO` and `Person.Hobby.mapper`.

```typescript
@Namespace('org.example.peopleHobbies') // 👈  absolute namespace
@Reviver<Person, Person.DTO>({
    '.': ({name: [firstName, lastName], birthDate, hobbies}) =>
        new Person(firstName, lastName, birthDate,
            hobbies as any as Person.Hobby[]),
    birthDate: Date,
    hobbies: Person.Hobby.mapper
})
export class Person { // 👈 "org.example.peopleHobbies.Person"
    constructor(
        public firstName: string,
        public lastName: string,
        public birthDate: Date,
        public hobbies: Person.Hobby[]
    ) {}
    toJSON(): Person.DTO {
        return {
            name: [this.firstName, this.lastName],
            birthDate: this.birthDate.toISOString().slice(0, 10) as any as Date,
            hobbies: this.hobbies.map(({ hobby, startDate }) =>
                [hobby, startDate.toISOString().slice(0, 10) as any as Date])
        }
    }
}
export namespace Person {
    export type DTO = {
        name: [string, string]
        birthDate: Date
        hobbies: Hobby.DTO[]
    }
    export interface Hobby {
        hobby: string,
        startDate: Date
    }
    export namespace Hobby {
        export type DTO = [string, Date];
        export const mapper: Mappers<Hobby[], Hobby.DTO[]> = {
            '*': {
                '.': ([hobby, startDate]) => ({ hobby, startDate }),
                1: Date
            }
        }
    }
}
```

Using classes may lead to some chicken 🐔 and egg 🥚 issue that can be resolved easily with an [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) :

```typescript
@Namespace('org.example.peopleHobbies') // 👈  absolute namespace
@Reviver<Person>({
    '.': Jsonizer.Self.apply(Person),
    birthDate: Date,
    hobbies: {
      //'*': Person.Hobby // 👈  symbol not yet known
        '*': (() => Person.Hobby)() // 👈  IIFE to the rescue
    }
})
export class Person { // 👈 "org.example.peopleHobbies.Person"
    constructor(
        public name: string,
        public birthDate: Date,
        public hobbies?: Person.Hobby[]
    ) {}
}
export namespace Person {
    @Reviver<Hobby>({
        '.': Jsonizer.Self.apply(Hobby),
        startDate: Date
    })
    @Namespace(Person) // 👈  relative namespace
    export class Hobby { // 👈 "org.example.peopleHobbies.Person.Hobby"
        constructor(
            public hobby: string,
            public startDate: Date
        ) {}
    }
}
```

> Remember that Jsonizer's namespaces and Typescript's namespaces don't serve the same purpose

## Reviving parsed data

Sometimes, instead of parsing the JSON text representation, you already get a JSON data structure, but not augmented by a reviver, typically with HTTP `fetch()`.

Jsonizer allows to revive existing not augmented data.

So, instead of having this :

```typescript
const personReviver = Reviver.get(Person);
const personFromJson = JSON.parse(personJson, personReviver);
```

Apply the reviver directly on the data structure :

```typescript
const personFromJsonNotRevived = JSON.parse(personJson); // or HTTP fetch()
// then you have your data structure, but not augmented with the expected types

// 👍  just launch the reviver on it
const personReviver = Reviver.get(Person);
const personFromJson = personReviver(personFromJsonNotRevived);
```

## Reviver generation

So far, each time we used `JSON.parse()` we passed it a reviver that we do defined. With some applications, for example when passing data through web sockets, you will juste parse some data without knowing which type it is.

Jsonizer allow to generate a relevant reviver during JSON serialization, and to use it later with `JSON.parse()`.

### Replacer

To generate a reviver, pass Jsonizer's replacer to `JSON.stringify()`, it is a replacer that captures every reviver encountered during stringification :

```typescript
const data = getData(); // can be different things
// create a context for the capture :
const replacer = Jsonizer.replacer();
// stringify with our replacer that also capture the mappings
const jsonData = JSON.stringify(data, replacer);

// every class decorated with `@Reviver` were captured
const jsonReviver = replacer.toString()
// NOTE: similar result with :
// const jsonReviver = JSON.stringify(replacer.getReviver());

sendOrStoreOrWhatever(jsonData, jsonReviver);
```

To respawn the data, parse the JSON reviver then pass the reviver to `JSON.parse()` :

```typescript
function parseData(jsonData: string, jsonReviver: string) {
    // revive the reviver                          👇 get the reviver for revivers
    const reviver = JSON.parse(jsonReviver, Reviver.get());
    // revive the data with the reviver
    return JSON.parse(jsonData, reviver);
}
```

* Example with a class :
```typescript
 // with 
function getData() {
    return new Person('Bob', new Date('1998-10-21'));
}
// jsonReviver might be :
// {".":"org.example.people.Person"}
```

> Above, the `Person` class was set in a namespace.

* Example with an array :
```typescript
 // with 
function getData() {
    return [
        new Person('Bob', new Date('1998-10-21'), [
            {   hobby: 'programming',
                startDate: new Date('2021-01-01'),
            },
            {   hobby: 'cooking',
                endDate: new Date('2020-12-31'),
            },
        ]),
        new Person('Alice', new Date('2002-04-01'))
    ];
}
// jsonReviver might be :
// {"*":"org.example.people.Person"}
```

* Example with nested structure :
```typescript
// with :
function getData() {
    return [
        {
            name: 'Bob',
            birthDate: new Date('1998-10-21'),
            hobbies: [
                {   hobby: 'programming',
                    startDate: new Date('2021-01-01'),
                },
                {   hobby: 'cooking',
                    endDate: new Date('2020-12-31'),
                },
            ]
        }, {
            name: 'Alice',
            birthDate: new Date('2002-04-01'),
        }
    ];
// jsonReviver will be :
// {  '*': {
//        birthDate: Date,
//        hobbies: {
//            '*': {
//                startDate: Date,
//                endDate: Date
//            }
//        }
//    }
// }
```

> Adjacent nested structures are merged when possible to reduce the required mappings. The optimization is smart enough to almost produce what you would have design by yourself.

#### Replacer direct invokation

A replacer can be invoked without calling `JSON.stringify(data, replacer)`.

Since the replacer function takes two parameters, the key and the value being stringified, just invoke it with the empty string ``'' as the key :

```typescript
// create a context for the capture :
const replacer = Jsonizer.replacer();
const serializable = replacer('', data); // key of data is ''
```

The replacer function is not responsible of the stringification, which is done by `JSON.stringify`, therefore the result looks like the DTO object before its stringification.

This allow to get serializable data to send without producing a JSON string. Since such usage is ruled by
the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
the `Date`s objects are preserved.

However, the reviver can be applied on the data received in order to rebuild class instances, which is not possible by the structured clone algorithm.

If you are not interesting on capturing the revivers, just use the default replacer :

```typescript
const serializable = Jsoniser.REPLACER('', data); // key of data is ''
```

### Subreviver

Taking a reviver, it is possible to extract a subreviver from it :

```typescript
interface Hobby {
    hobby: string,
    startDate: Date
}

@Reviver<Person>({ // 👈  an "all-in-one" reviver
    '.': Jsonizer.Self.apply(Person),
    birthDate: Date,
    hobbies: {
        '*': {
            startDate: Date
        }
    }
})
class Person {
    constructor(
        public name: string,
        public birthDate: Date,
        public hobbies?: Hobby[]
    ) {}
}

const hobbies = [
    {   hobby: 'programming',
        startDate: new Date('2021-01-01'),
    },
    {   hobby: 'cooking',
        startDate: new Date('2020-12-31'),
    },
];
const jsonHobbies = JSON.stringify(hobbies);

const personReviver = Reviver.get(Person);
const hobbiesReviver = personReviver.hobbies as Reviver<Hobby[]>; // 👈  a subreviver
const hobbiesFromJson = JSON.parse(jsonHobbies, hobbiesReviver); // 👈  as usual
```

This is not the same as taking the field from the mapper (the mapper is just a plain javascript object), therefore there is no subreviver for `'*'`, neither for ranges and RegExp ; instead, you may ask whether there is a subreviver for a given key, and you will get the most relevant reviver :

```typescript
const jsonHobby = JSON.stringify(hobbies[0]);
const hobbyReviver = personReviver.hobbies[0] as Reviver<Hobby>; // 👈  a subreviver that matches the '*' entry
const hobbyFromJson = JSON.parse(jsonHobby, hobbyReviver); // 👈  as usual
```

### Dynamic reviver

It is possible to send through some channel the payload data and its reviver bundled in a single JSON data structure ; and in the other side to revive the reviver then using it to parse the data.

From that bases, it is possible to design a dynamic reviver :
* where the data must be sequentially after its reviver (because it is required to augment the payload data)
* where the JSON bundle have to be created artificially (because the reviver is ready after stringify ends)

> Instead of parsing the reviver then parsing the data with the former,
> a dynamic reviver will parse both at once.
> In the [previous example](#replacer), the reviver and the data
> were parsed separately.

For example, if we intend to send the tuple `[jsonReviver, jsonData]` :

```typescript
const data = getData(); // can be different things
// create a context for the capture :
const replacer = Jsonizer.replacer();
// stringify with our replacer that also capture the mappings
const jsonData = JSON.stringify(data, replacer);
// every class decorated with `@Reviver` were captured
const jsonReviver = replacer.toString();

const jsonTuple = `[${jsonReviver},${jsonData}]`; // 👈  a tuple to send as a JSON string
```

On the other side of the channel :

```typescript
const jsonTuple = ... // get the data somehow
let reviver: Reviver; // 👈  will hold the Reviver = jsonTuple[0]
const dynamicReviver = Jsonizer.reviver<any, [Reviver, any]>({ // 👈  tuple signature is [Reviver, any]
    '.': ([_rev_, data]) => data, // 👈  just return the data
    0: {
        '.': jsonReviver => reviver = Reviver.get()(jsonReviver) // 👈  revive the reviver 
    },
    1: new Proxy({}, { // 👈  delegate to the reviver 
        get: (obj, prop) => reviver[prop as any],
        ownKeys: () => Reflect.ownKeys(reviver), 
        getPrototypeOf: () => Reflect.getPrototypeOf(reviver)
    })
});
const dataFromJson = JSON.parse(jsonTuple, dynamicReviver); // 👈  you have it
// as usual, dataFromJson contains augmented typed data
```

### Plain object with `toJSON()`

Letting Jsonizer capturing a reviver is not magik. If you have the (bad ?) idea to plug on a plain object a specific `.toJSON()` function, the serialization will work fine, and the parsing too as long as you supply the reviver. But if you expect Jsonizer to capture the reviver dynamically, you have to embrace fully the concept by :

* creating a place holder class decorated with `@Reviver` for your plain object
* tell your plain object that it can be constructed by it

Concretely, if you start with something that looks like this :

```typescript
function createPerson(name: string, birthDate: Date) {
    return {
        name,
        birthDate,
        toJSON() {
            return [this.name, this.birthDate] as const;
        }
    }
}
```

That reviver will work normally :

```typescript
//                                               Target                      Source
//                                                 👇                          👇
const personReviver = Jsonizer.reviver<ReturnType<typeof createPerson>, [string, Date]>({
    '.': ([name, birthDate]) => createPerson(name, birthDate),
    1: Date
});
```

But if you want to capture it, you'll have to create a placeholder class that can reverse the process.
Since that placeholder class is bound to a reviver, let's call it a factory :

```typescript
//                 Target                    Source
//                   👇                         👇
@Reviver<ReturnType<typeof createPerson>, [string, Date]>({
    '.': ([name, birthDate]) => createPerson(name, birthDate),
    1: Date
})
class PersonFactory {} // 👈  it's empty because it's just a placeholder class
```

But to make working the capture phase with a replacer, the plain object has to be bound to the placeholder class :

```typescript
function createPerson(name: string, birthDate: Date) {
    return {
        name,
        birthDate,
        toJSON() {
            return [this.name, this.birthDate] as const;
        },
        constructor: PersonFactory
    }
}
```

Notice that the following code is more correct :

```typescript
function createPerson(name: string, birthDate: Date) {
    const person = {
        name,
        birthDate
    }
    Object.defineProperty(person, 'toJSON', {
        value: function() {
            return [this.name, this.birthDate] as const;
        },
        enumerable: false
    });
    Object.setPrototypeOf(person, PersonFactory.prototype);
    return person;
}
```

...but at this time you ought simply wonder why not turning the structure to a real class ?

### Optimization

When generating the revivers, objects that are not class instances may have a small impact on performances.

Classes are short-circuit, since they are referred with their qualified names and embed themselves the recipes of reviving ; conversely, objects that are not class instances need to generate the mappings of their hierarchy, and some optimizations are made for merging adjacent mappings on arrays. However, arrays or tuples of class instances don't suffer of such penalty.

### Asynchronizer

Jsonizer fits well in [Asynchronizer](https://badcafe.github.io/asynchronizer).

> Asynchronizer allows to define consistent [RPC functions](https://en.wikipedia.org/wiki/Remote_procedure_call) to send objects as JSON data through various channels (Web socket, HTTP, node clusters, web workers, etc), manages asynchronous return values or errors, handles broadcasting and multicasting, etc.

In Asynchronizer, a new component called a data transfer handler (DTH) is used to describe a group of RPC functions (like a service, but a service is strongly related to client-server exchange, whereas a DTH is a more general concept) :

* `myApp-shared`
```typescript
// see Person class definition in previous example
export namespace Person {
    // see Hobby class definition in previous example

    @Namespace(Person)
    export abstract class $ {  // 👈  a Data Transfer Handler
        getPersonByName(name: string): Person // well, I didn't set an ID on Person 🥴
        getPersonsByBirthDate(date: Date): Person[]
        getPersonsWithHobby(hobby: string[], startDate: Date): Person[]
    }
}
```

Applications made with Asynchronizer are usually isomorphic applications with at least 3 parts :

```
[APP_ROOT]
    ┣━myApp-shared      contains the classes definition with their DTH
    ┃                                           (the snippet code above)
    ┣━myApp-client      is the client app ; it will use `Person.$`
    ┃                                               to ask for the data
    ┗━myApp-server      is the server app ; it will implement `Person.$`
                                                    to respond to the client
```

Say that we are using a web socket channel between the client and server ; the client may invoke the server like this :

* `myApp-client`
```typescript
const ws = ... // create a client web socket for the path '/ws'
// create a channel and get its transfer handler
const th = SocketClientChannel.get(ws).transferHandler(); // 👈  1 line conf for Asynchronizer
// create a socket client proxy to send messages
const personService = th.bindSender(Person.$); // a sender is a stateless singleton
// send messages on button click
someButton.addEventListener('click', async ev => {
    ev.preventDefault();
    // Asynchronizer turns the RPC function
    //    to an async function 👇
    const persons = await personService.getPersonsByBirthDate(someDate);
    //    👆 Asynchronizer transparently                       👆 
    //                   revive the Person[]     and stringify the date
    renderHTMLPersonsView(persons);
    return false;
}, true);
```

Server side, we have to implement the RPC functions of the interface :

* `myApp-server`
```typescript
const ws = ... // create and configure a web socket server...
const th = SocketServerChannel.get(ws, '/ws').transferHandler(); // 👈  1 line conf for Asynchronizer
// receives messages from the client
th.bindReceiver(Person.$, { // a receiver is a stateless singleton
 // 👇 Asynchronizer turns the RPC functions to async functions
    async getPersonsByBirthDate(date) {
                              // 👆 Asynchronizer transparently revive the date...
        const persons = await store.getPersonByBirthDate(date);
        return persons; // 👈  ...and stringify the Person[]
    },
    async getPersonsWithHobby(hobby, startDate) {
        const persons = await store.getPersonsWithHobby(hobby, startDate.getFullYear());
        return persons;               // look, it's a Date instance 👆
    },
    async getPersonByName(name) {
        return await store.getPersonByName(name);
    }
});
```

Above :

* the types are inferred from the signature of the DTH methods,
* and Jsonizer transparently revive the arguments to the expected objects instances.

In fact, when using Asynchronizer, you just have to decorate your model classes with `@Reviver` and `@Namespace`, and your instances will be revived client-side and server-side thanks to Jsonizer.
