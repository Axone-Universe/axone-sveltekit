import { json } from '@sveltejs/kit';

import { AURA_DB } from '$env/static/private';
import { neo4jDriver } from '$lib/db/driver';
import type { APIResponse } from '$lib/helpers/types';
import { Book } from '$lib/nodes/digital-products/Book';
import type { RequestHandler } from './$types';

export const POST = (async ({ request }) => {
	const session = neo4jDriver.session({ database: AURA_DB });

	const params = await request.json();
	const headers = request.headers;
	const userId: string = headers.get('userid')!;
	const title = params.title;
	const summary = params.summary;

	const book = new Book({ id: '0', title: title, creator: { id: userId, name: '', email: '' } });

	let result;
	try {
		result = await book.create<Book>();
	} finally {
		session.close();
	}

	const response = {
		message: 'Book created successfully',
		data: result.records[0].get('properties')
	} as APIResponse;

	return json(response, { status: 200 });
}) satisfies RequestHandler;