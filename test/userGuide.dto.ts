import { Jsonizer } from "../src";

export interface Person { // 👈  Target with clean types
    firstName: string
    birthDate: Date
    numberOfHobbies: number
    hobbies: string[]
}

// as a bonus, we introduce a namespace (more about that later)
export namespace Person {
    export interface DTO { // 👈  Source with bad types
        first_name?: string
        birthDate: string
        numberOfHobbies: string
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
                const [day, montIndex, year] = date.split('/') // don't use new Date(year, montIndex - 1, day)
                    .map(part => parseInt(part));              // because it may shift due to the local time zone
                return new Date(Date.UTC(year, montIndex - 1, day));
            }
        },
        hobbies: {
            //  👇 split CSV to array
            '.': csv => csv.split(',')
        }
    })
}
