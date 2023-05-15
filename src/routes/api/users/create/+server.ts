import { json } from '@sveltejs/kit';

import { AURA_DB } from '$env/static/private';
import { neo4jDriver } from '$lib/db/driver.js';
import type { APIResponse } from '$lib/helpers/types';
import { Author } from '$lib/nodes/Author';
import type { RequestHandler } from './$types';

export const POST = (async ({ request }) => {
	const params = await request.json();

	const name = params.name;
	const email = params.email;

	const author = new Author({ id: '0', name: name, email: email });

	const session = neo4jDriver.session({ database: AURA_DB });
	let result;
	try {
		result = await author.create<Author>(session);
	} finally {
		session.close();
	}

	console.log(result.records[0].get('properties'));
	console.log('\n');

	const response = {
		message: 'User created successfully',
		data: result.records[0].get('properties')
	} as APIResponse;

	return json(response, { status: 200 });
}) satisfies RequestHandler;
