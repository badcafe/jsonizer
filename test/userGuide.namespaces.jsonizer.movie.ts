import { Namespace } from "../src";

class Movie {}

@Namespace(Movie)
export class Category {}
    // 👆 qualified name set to 'Movie.Category'
