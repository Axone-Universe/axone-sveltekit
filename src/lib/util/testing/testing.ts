import { faker } from '@faker-js/faker';
import type { Session, User } from '@supabase/supabase-js';
import mongoose, { type HydratedDocument } from 'mongoose';
import { ulid } from 'ulid';

import { GenresBuilder } from '$lib/shared/genre';
import type { StorylineProperties } from '$lib/shared/storyline';
import { router } from '$lib/trpc/router';

import {
	TEST_MONGO_PASSWORD,
	TEST_MONGO_URL,
	TEST_MONGO_USER,
	TEST_MONGO_DB,
	MONGO_PASSWORD,
	MONGO_URL,
	MONGO_USER,
	MONGO_DB,
	TEST_USER_ID,
	TEST_USER_FIRST_NAME,
	TEST_USER_LAST_NAME
} from '$env/static/private';
import { UserPropertyBuilder } from '$lib/shared/user';

/** Supabase Test User Infos */
export const testUserOne: User = {
	id: TEST_USER_ID ? TEST_USER_ID : '1',
	email: 'user_one@test.com',
	user_metadata: {
		firstName: TEST_USER_FIRST_NAME ? TEST_USER_FIRST_NAME : 'user',
		lastName: TEST_USER_LAST_NAME ? TEST_USER_LAST_NAME : 'one'
	},
	app_metadata: {},
	aud: '',
	created_at: ''
};

export const testUserTwo: User = {
	id: '2',
	email: 'user_two@test.com',
	user_metadata: { firstName: 'user', lastName: 'two' },
	app_metadata: {},
	aud: '',
	created_at: ''
};

export const testUserThree: User = {
	id: '3',
	email: 'user_three@test.com',
	user_metadata: { firstName: 'user', lastName: 'three' },
	app_metadata: {},
	aud: '',
	created_at: ''
};

export function generateTestUser(): User {
	const id = `test-${ulid()}`;
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	return {
		id,
		email: `${firstName}.${lastName}.${id.substring(id.length - 5, id.length - 1)}@test.com`,
		user_metadata: {
			firstName,
			lastName
		},
		app_metadata: {},
		aud: '',
		created_at: ''
	};
}

/**
 * Creates a session from a given user supabase
 * @param supabaseUser
 * @returns
 */
export function createTestSession(supabaseUser: User) {
	const testSession: Session = {
		access_token: '',
		refresh_token: '',
		expires_in: 0,
		token_type: '',
		user: supabaseUser
	};
	return testSession;
}

/**
 * Creates a book from a given title ans session
 * @param session
 * @param title
 * @returns
 */
export async function createBook(session: Session, title: string) {
	const caller = router.createCaller({ session: session });

	const genres = new GenresBuilder().with('Action');

	const book = await caller.books.create({
		title,
		imageURL: 'www.example.com',
		genres: Array.from(genres.build()),
		description: '',
		published: true
	});

	return book;
}

export async function createChapter(
	session: Session,
	title: string,
	description: string,
	storyline: HydratedDocument<StorylineProperties>,
	prevChapterID?: string
) {
	const caller = router.createCaller({ session: session });

	const chapter = await caller.chapters.create({
		title: title,
		description: description,
		storylineID: storyline._id,
		bookID: typeof storyline.book === 'string' ? storyline.book : storyline.book!._id,
		prevChapterID: prevChapterID,
		published: true
	});

	return chapter;
}

/**
 * Differentiate the DBs so that Dev DB is not wiped out when testing
 */
export async function connectTestDatabase() {
	const options: mongoose.ConnectOptions = {
		dbName: TEST_MONGO_DB,
		user: TEST_MONGO_USER,
		pass: TEST_MONGO_PASSWORD
	};

	await mongoose.connect(TEST_MONGO_URL, options);
}

export async function connectDevDatabase() {
	const options: mongoose.ConnectOptions = {
		dbName: MONGO_DB,
		user: MONGO_USER,
		pass: MONGO_PASSWORD
	};

	await mongoose.connect(MONGO_URL, options);
}

export async function cleanUpDatabase(isPartOfDBSetup = false) {
	await Promise.all(
		Object.values(mongoose.connection.collections).map(async (collection) => {
			if (isPartOfDBSetup && collection.collectionName.toLowerCase() === 'users') {
				await collection.deleteMany({ _id: /^test-/ });
			} else {
				await collection.deleteMany({});
			}
		})
	);
	// await mongoose.connection.db.dropDatabase();
}

/**
 * Supabase is external to the platform. This creates the platform user from the supabase session user
 * @param session
 * @returns
 */
export const createDBUser = async (session: Session) => {
	const caller = router.createCaller({ session });

	const supabaseUser = session.user;

	const userPropertyBuilder = new UserPropertyBuilder();
	const userProperties = userPropertyBuilder.getProperties();

	userProperties._id = '';
	userProperties.firstName = supabaseUser.user_metadata.firstName;
	userProperties.lastName = supabaseUser.user_metadata.lastName;
	userProperties.email = session.user.email;

	return await caller.users.create(userProperties);
};
