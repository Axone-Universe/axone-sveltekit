import { PORT } from '$env/static/private';

describe('books', () => {
	test('create book', async () => {
		// create a user first
		const userResponse = await fetch(`http://localhost:${PORT}/api/users/create`, {
			method: 'POST',
			body: JSON.stringify({
				name: 'User 1',
				email: 'user1@example.com'
			}),
			headers: {
				accept: 'application/json'
			}
		});

		const jsonData = await userResponse.json();
		const userId = jsonData.data.id;

		const bookResponse = await fetch(`http://localhost:${PORT}/api/books/create`, {
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

		expect((await bookResponse.json()).data.title).toEqual("Harry Potter And The Socerer's Stone");
	});

	test('get book', async () => {
		const bookResponse = await fetch(`http://localhost:${PORT}/api/books/get`);

		expect((await bookResponse.json()).data[0].title).toEqual(
			"Harry Potter And The Socerer's Stone"
		);
	});
});
