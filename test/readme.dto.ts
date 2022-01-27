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

    export const reviver = Jsonizer.reviver<Person, Person.DTO & { firstName: string }>({
        '.': item => {
            //  👇 rename the field
            item.firstName = item.first_name!;
            delete item.first_name;
            return item; // we choose to not make a copy, we are
                        // just returning the updated structure          🖕
                        // this is why the 'firstName' field is added to the source type
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
                const utc = new Date();
                utc.setUTCHours(0, 0, 0, 0);
                utc.setUTCFullYear(year, montIndex - 1, day);
                return utc;            
            }
        },
        hobbies: {
            //  👇 split CSV to array
            '.': csv => csv.split(',')
        }
    })
}
