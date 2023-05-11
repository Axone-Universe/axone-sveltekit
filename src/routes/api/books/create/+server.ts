import { json } from '@sveltejs/kit';
import { Book } from '$lib/nodes/digital-products/Book'
import type { response } from '$lib/helpers/types'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	const params = await request.json();

	let title = params.title
	let summary = params.summary

	let book = new Book({ title: title })

	const result = await book.create<Book>();

	console.log(result.records[0].get('properties'))
	console.log('\n');

	let response = { message: "Book created successfully", data: result.records[0].get('properties') } as response

	return json(response, { status: 200 });
}