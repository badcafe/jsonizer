import { Reviver, Mappers, Namespace } from "../src";

@Namespace('org.example.peopleHobbies') // 👈  absolute namespace
@Reviver<Person, Person.DTO>({
    '.': ({name: [firstName, lastName], birthDate, hobbies}) =>
        new Person(firstName, lastName, birthDate,
            hobbies as any as Person.Hobby[]),  // 👈  change the type accordingly
    birthDate: Date,
    hobbies: Person.Hobby.mapper
})
export class Person {
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
