# Jsonizer 

<div style='margin: 20px; padding: 20px; border: solid 3px'>
    <a href="http://badcafe.github.io/jsonizer">Full documentation and API available HERE</a>
</div>

> **Structural reviving for JSON**
>
> **Easy nested instance reviving for JSON**

`@badcafe/jsonizer` is a Javascript library  that takes care of instances of classes in the hierarchy of your data structure when you use `JSON.stringify()` and `JSON.parse()`.

`@badcafe/jsonizer` is written in [Typescript](https://www.typescriptlang.org/) but can also be used just in JS.

<p style='align: center'>
    <img src="docs/matryoshka.svg"/>
</p>

### Overview

<a href="http://badcafe.github.io/jsonizer">Full documentation and API available HERE</a>

Let's consider some data :

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

Dates in `personJson` will appear as text (e.g. `"birthDate":"1998-10-21T00:00:00.000Z"`), and if you parse back that JSON string to a plain object, every date field will be `string` instead of `Date` !

Now, let's use **Jsonizer** 😍

```typescript
// we are using Typescript in this example
// but without the type it works the same in pure JS 
const personReviver = Jsonizer.reviver<typeof person>({
    birthDate: Date,
    hobbies: {
        '*': {
            startDate: Date
        }
    }
});
const personFromJson = JSON.parse(personJson, personReviver);
```

Every dates string in the JSON text have been mapped to `Date` objects in the parsed result.

**Jsonizer** can indifferently revive JSON data structures (arrays, objects) or class instances with recursively nested custom classes, third-party classes, built-in classes, or sub JSON structures (arrays, objects).

See it in action : [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/typescript-jsonizer-class-example?file=index.ts)

<a href="http://badcafe.github.io/jsonizer">Full documentation and API available HERE</a>
