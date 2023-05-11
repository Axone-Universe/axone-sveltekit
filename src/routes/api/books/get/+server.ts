import { AURA_PASSWORD, AURA_URL, AURA_USER } from '$env/static/private';
import { error, json } from '@sveltejs/kit';
import neo4j, { DateTime, Integer, Node, Relationship } from 'neo4j-driver';

// type Book = Node<
// 	Integer,
// 	{
// 		title: string;
// 	}
// >;

// type User = Node<
// 	Integer,
// 	{
// 		name: string;
// 	}
// >;

// type Authored = Relationship<
// 	Integer,
// 	{
// 		date: DateTime;
// 	}
// >;

// interface UserAuthoredBook {
// 	user: User;
// 	authored: Authored;
// 	book: Book;
// }

export interface Book {
	title: string;
	author: {
		name: string;
	};
}

const driver = neo4j.driver(AURA_URL, neo4j.auth.basic(AURA_USER, AURA_PASSWORD));

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const author = String(url.searchParams.get('author') ?? '');
	const session = driver.session({ database: 'neo4j' });
	const books: Book[] = [];

	let readQuery =
		'MATCH (u:User {name: $author})-[:AUTHORED]->(b) RETURN u.name as name, b.title as title';

	if (author === '') {
		readQuery = 'MATCH (u:User)-[:AUTHORED]->(b:Book) RETURN u.name as name, b.title as title';
	}

	try {
		const readResult = await session.executeRead((tx) => tx.run(readQuery, { author }));

		readResult.records.forEach((record) => {
			books.push({ title: record.get('title'), author: { name: record.get('name') } });
		});
	} catch (e) {
		throw error(500, `Something went wrong: ${e}`);
	} finally {
		await session.close();
	}

	return json({
		books
	});
}
