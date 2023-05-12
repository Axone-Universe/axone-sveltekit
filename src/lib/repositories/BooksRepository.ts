import type { BookProperties } from '$lib/nodes/base/NodeProperties'
import type { Book } from '$lib/nodes/digital-products/Book'
import DBDriver from '$lib/db/DBDriver'

export class BooksRepository {

    // TODO: supply the context i.e. user sessions, permissions etc
    constructor() { }

    async getBooks(): Promise<BookProperties[]> {
        let driver = new DBDriver().getDriver()
        const session = driver.session({ database: 'neo4j' });

        const books: BookProperties[] = [];

        let cypher =
            `MATCH (book:Book)-[:CREATED]-(user:User)
            RETURN book{.*, creator: user{.*}} AS properties`

        let result = await session.executeRead(tx =>
            tx.run<Book>(cypher)
        )

        result.records.forEach((record) => {
            books.push(record.get('properties'));
        });

        return new Promise<BookProperties[]>((resolve) => {
            resolve(books);
        });
    }
}