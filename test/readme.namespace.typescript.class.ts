import { Reviver, Jsonizer, Namespace } from "../src";

@Namespace('org.example.peopleHobbies') // 👈  absolute namespace
@Reviver<Person>({
    '.': Jsonizer.Self.apply(Person),
    birthDate: Date,
    hobbies: {
      //'*': Person.Hobby // 👈  symbol not yet known
        '*': (() => Person.Hobby)()
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
