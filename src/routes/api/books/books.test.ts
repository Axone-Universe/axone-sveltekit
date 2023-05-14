import { POST as createUser } from '../users/create/+server';
import { POST as createBook } from './create/+server';
import { GET as getBook } from './get/+server';

describe('books', () => {
	test('create book', async () => {
		// create a user first
		let request = new Request('http://localhost:5173/api/users/create', {
			method: 'POST',
			body: JSON.stringify({
				name: 'User 1',
				email: 'user1@example.com'
			}),
			headers: {
				accept: 'application/json'
			}
		});

		const userResponse = await createUser({ request });

		const jsonData = await userResponse.json();
		const userId = jsonData.data.id;

		request = new Request('http://localhost:5173/api/books/create', {
			method: 'POST',
			body: JSON.stringify({
				title: "Harry Potter And The Socerer's Stone",
				summary: 'Setting the body property'
			}),
			headers: {
				accept: 'application/json',
				userId: userId
			}
		});

		const bookResponse = await createBook({ request });

		expect((await bookResponse.json()).data.title).toEqual("Harry Potter And The Socerer's Stone");
	});

	test('get book', async () => {
		const url = new URL('http://localhost:5173/api/books/get');
		const bookResponse = await getBook({ url });

		expect((await bookResponse.json()).data[0].title).toEqual(
			"Harry Potter And The Socerer's Stone"
		);
	});
});
