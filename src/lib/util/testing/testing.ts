import type { Session, User } from '@supabase/supabase-js';
import { router } from '$lib/trpc/router';
import mongoose, { type HydratedDocument } from 'mongoose';
import { GenresBuilder } from '$lib/shared/genres';

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
import type { StorylineProperties } from '$lib/shared/storyline';

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

	const genres = new GenresBuilder();
	genres.genre('Action');

	const book = await caller.books.create({
		title,
		imageURL: 'www.example.com',
		genres: genres.getGenres(),
		description: ''
	});

	// set public permissions
	await caller.permissions.create({
		documentID: book._id,
		documentType: 'Book',
		permission: 'edit',
		public: true
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
		prevChapterID: prevChapterID
	});

	// set public permissions
	await caller.permissions.create({
		documentID: chapter._id,
		documentType: 'Chapter',
		permission: 'edit',
		public: true
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

export async function cleanUpDatabase() {
	console.log('dropping DB');
	await mongoose.connection.db.dropDatabase();
}

/**
 * Supabase is external to the platform. This creates the platform user from the supabase session user
 * @param session
 * @returns
 */
export const createDBUser = async (session: Session) => {
	const caller = router.createCaller({ session });

	const supabaseUser = session.user;
	const userDetails = {
		_id: '',
		firstName: supabaseUser.user_metadata.firstName,
		lastName: supabaseUser.user_metadata.lastName,
		email: session.user.email
	};
	return await caller.users.create(userDetails);
};
