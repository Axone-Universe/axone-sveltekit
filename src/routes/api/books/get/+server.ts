import { neo4jDriver } from '$lib/db/driver';
import type { APIResponse } from '$lib/helpers/types.js';
import { BooksRepository } from '$lib/repositories/BooksRepository.js';
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const session = neo4jDriver.session({ database: 'neo4j' });

	const bookRepo = new BooksRepository();

	let result;

	try {
		result = await bookRepo.getBooks(session);
	} finally {
		session.close();
	}

	const response = { message: 'Books Obtained', data: result } as APIResponse;

	return json(response, { status: 200 });
}
