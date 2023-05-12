import type { BookProperties } from '$lib/nodes/base/NodeProperties.js';
import { BooksRepository } from '$lib/repositories/BooksRepository.js';
import { error, json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const author = String(url.searchParams.get('author') ?? '');

	let books: BookProperties[] = [];
	let bookRepo = new BooksRepository()

	books = await bookRepo.getBooks()

	// console.log(books)
	// console.log("\n\n\n\n")

	let response = { message: "Books Obtained", data: books } as response

	return json(response, { status: 200 });
}
