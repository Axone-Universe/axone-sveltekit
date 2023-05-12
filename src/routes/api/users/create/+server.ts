import { json } from '@sveltejs/kit';
import { Author } from '$lib/nodes/Author'
import type { response } from '$lib/helpers/types'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    const params = await request.json();

    let name = params.name
    let email = params.email

    let author = new Author({ id: '0', name: name, email: email })

    const result = await author.create<Author>();

    console.log(result.records[0].get('properties'))
    console.log('\n');

    let response = { message: "User created successfully", data: result.records[0].get('properties') } as response

    return json(response, { status: 200 });
}