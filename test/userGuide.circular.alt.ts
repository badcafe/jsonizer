import { Reviver, Jsonizer } from "../src";

// so far, JEST fails to compile (with Babel) this module
// see circular-*.test.ts

@Reviver<Hobby>({
    '.': Jsonizer.Self.apply(Hobby),
    startDate: Date,
    // manager: Person // 👈  value not yet known
    manager: () => Person // 👈  deferring the resolution 
                          //     of a class defined after
})
export class Hobby {
    constructor(
        public hobby: string,
        public startDate: Date,
        public manager?: Person // 👈  this works because it's
                                //     just a type reference !
    ) {}
}

@Reviver<Person>({
    '.': Jsonizer.Self.apply(Person),
    birthDate: Date,
    hobbies: {
        '*': Hobby  // 👈  direct reference
                    //     of a class defined before
    }
})
export class Person {
    constructor(
        public name: string,
        public birthDate: Date,
        public hobbies?: Hobby[]
    ) {}
}
