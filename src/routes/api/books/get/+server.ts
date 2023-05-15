import type { APIResponse } from '$lib/helpers/types.js';
import { BooksRepository } from '$lib/repositories/BooksRepository.js';
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {

	const bookRepo = new BooksRepository();

	const result = await bookRepo.getBooks();

	const response = { message: 'Books Obtained', data: result } as APIResponse;

	return json(response, { status: 200 });
}
