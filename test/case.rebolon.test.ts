import { Jsonizer, Reviver } from "../src";

describe('Use case (taken from another tool)', () => {
    describe('https://github.com/Rebolon/json-reviver', () => {
        // json object restored from localStorage or received from API call       
        const book = {
            "book": {
                "title": "Zombies in western culture",
                "editors": [{
                    // not the format given by JSON.stringify(new Date())
                    // therefore, we need a custom Date class
                    "publicationDate": 1519664915,
                    "collection": "printed version",
                    "isbn": "9781783743230",
                    "editor": {
                        "name": "Open Book Publishers"
                    }
                }, {
                    "publicationDate": 1519747464,
                    "collection": "ebooks",
                    "isbn": "9791036500824",
                    "editor": {
                        "name": "Open Book Publishers"
                    }
                }],
                "serie": {
                    "name": "Open Reports Series"
                }
            }
        }

        // you can now use all feature of Book entity from your `book`  constant
        // You can also restore array of object like this (root node book is not mandatory):
        const books = [{
            "book": {
                "title": "Zombies in western culture"
            }
        },
        {   "book": {
                "title": "Another book with Zombies in western culture"
            }
        }]

        // now, Jsonizer in action :

        type BookDTO = typeof book.book; // weird wrapper in the example

        // weird date serialization format
        @Reviver<UnixDate, number>({
            '.': date => new UnixDate(date * 1000)
        })
        class UnixDate extends Date {
            toJSON() {
                return super.getTime() / 1000 as any;
                // another violation of Date contract: toJSON() must return a string,
                // but in the json we have a number
            }
        }

        @Reviver<Editor>({
            '.': Jsonizer.Self.assign(Editor)
        })
        class Editor {
            id: number = NaN
            name: string = ''
        }

        @Reviver<Editors>({
            '.': Jsonizer.Self.assign(Editors),
            editor: Editor,
            publicationDate: UnixDate
        })
        class Editors { // weird name, having a plural form for a single editor ???
            id: number = NaN
            editor: Editor | number = NaN
            publicationDate: Date = new UnixDate() // otherwise it won't be stringified to a unix time
            collection?: string = ''
            isbn?: string = ''
        }

        @Reviver<Book, BookDTO>({
            '.': Jsonizer.Self.assign(Book),
            editors: {
                '*': Editors
            }
        })
        class Book {
            id: number = NaN
            title: string = ''
            description?: string = ''
            indexInSerie?: number

            editors: Array<Editors> = []

            addEdition(edition: Editors) {
                if (typeof this.editors == 'undefined') {
                    this.editors = []
                }
                this.editors.push(edition)
            }

            setEdition(edition: Editors) {
                this.editors = []
                this.editors.push(edition)
            }

            serie: { name?: string } = {}
        }

        test('Revive wrapped book', () => {
            // don't know why there's a 'book' object around, but let's revive it anyway
            const bookReviver = Jsonizer.reviver<{ book: Book }>({
                'book': Book
            });
            const jsonBook = JSON.stringify(book);
            const revivedBook = JSON.parse(jsonBook, bookReviver);
            expect(revivedBook.book).toBeInstanceOf(Book);
            expect(revivedBook.book.title).toBe(book.book.title);
            expect(revivedBook.book.editors).toHaveLength(2);
            revivedBook.book.editors.forEach((ed, i) => {
                expect(ed).toBeInstanceOf(Editors);
                expect(ed.collection).toBe(book.book.editors[i].collection);
                expect(ed.isbn).toBe(book.book.editors[i].isbn);
                expect((ed.editor as Editor).name).toBe(book.book.editors[i].editor.name);
                expect(ed.publicationDate).toBeInstanceOf(Date);
                expect(ed.publicationDate.getTime() / 1000).toBe(book.book.editors[i].publicationDate);
            });
        });
        test('Revive book', () => {
            const bookReviver = Reviver.get(Book);
            const jsonBook = JSON.stringify(book.book);
            const revivedBook = JSON.parse(jsonBook, bookReviver);
            expect(revivedBook).toBeInstanceOf(Book);
            expect(revivedBook.title).toBe(book.book.title);
            expect(revivedBook.editors).toHaveLength(2);
            revivedBook.editors.forEach((ed, i) => {
                expect(ed).toBeInstanceOf(Editors);
                expect(ed.collection).toBe(book.book.editors[i].collection);
                expect(ed.isbn).toBe(book.book.editors[i].isbn);
                expect((ed.editor as Editor).name).toBe(book.book.editors[i].editor.name);
                expect(ed.publicationDate).toBeInstanceOf(Date);
                expect(ed.publicationDate.getTime() / 1000).toBe(book.book.editors[i].publicationDate);
            });
        });
        test('Revive books', () => {
            const booksReviver = Jsonizer.reviver<{ book: Book }[]>({
                '*': {
                    'book': Book
                }
            });
            const jsonBooks = JSON.stringify(books);
            const revivedBooks = JSON.parse(jsonBooks, booksReviver);
            expect(revivedBooks).toHaveLength(2);
            for (const i of [0, 1]) {
                expect(revivedBooks[i].book).toBeInstanceOf(Book);
                expect(revivedBooks[i].book.title).toBe(books[i].book.title);
            }
        });
    });
});
