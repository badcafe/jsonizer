import { Reviver, Jsonizer } from "../src";

@Reviver<Person>({
    '.': Jsonizer.Self.apply(Person),
    birthDate: Date,
    hobbies: {
        // '*': Hobby // 👈  value not yet known
        '*': () => Hobby  // 👈  deferring the resolution 
                          //     of a class defined after
    }
})
export class Person {
    constructor(
        public name: string,
        public birthDate: Date,
        public hobbies?: Hobby[] // 👈  this works because it's
                                 //     just a type reference !
    ) {}
}

@Reviver<Hobby>({
    '.': Jsonizer.Self.apply(Hobby),
    startDate: Date,
    manager: Person // 👈  direct reference
                    //     of a class defined before
})
export class Hobby {
    constructor(
        public hobby: string,
        public startDate: Date,
        public manager?: Person
    ) {}
}
