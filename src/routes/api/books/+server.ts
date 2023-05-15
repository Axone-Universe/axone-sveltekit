import { error, json } from '@sveltejs/kit';

import { AURA_DB } from '$env/static/private';
import { neo4jDriver } from '$lib/db/driver';
import type { RequestHandler } from './$types';

export interface Book {
	title: string;
	author: {
		name: string;
	};
}

export const GET = (async ({ url }) => {
	const author = String(url.searchParams.get('author') ?? '');
	const session = neo4jDriver.session({ database: AURA_DB });
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
}) satisfies RequestHandler;
