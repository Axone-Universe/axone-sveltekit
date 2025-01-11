import { faker } from '@faker-js/faker';
import type { Session, User } from '@supabase/supabase-js';
import mongoose, { type HydratedDocument } from 'mongoose';
import { ulid } from 'ulid';

import { GenresBuilder, type Genre } from '$lib/properties/genre';
import type { StorylineProperties } from '$lib/properties/storyline';
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
import { UserPropertyBuilder } from '$lib/properties/user';
import type { Rating, ReviewOf } from '$lib/properties/review';
import { PermissionPropertyBuilder, type PermissionProperties } from '$lib/properties/permission';
import type { CreateBook } from '$lib/trpc/schemas/books';

/** Supabase Test User Infos */
export const testUserOne: User = {
	id: TEST_USER_ID ? TEST_USER_ID : '1',
	email: 'test.user.one@test.com',
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
	email: 'test.user.two@test.com',
	user_metadata: { firstName: 'user', lastName: 'two' },
	app_metadata: {},
	aud: '',
	created_at: ''
};

export const testUserThree: User = {
	id: '3',
	email: 'test.user.three@test.com',
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
 * @returns
 */
export async function createBook(testSession: Session, title?: string, genres: Genre[] = []) {
	const caller = router.createCaller({ session: testSession });

	const publicPermission =
		new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>;
	publicPermission.permission = 'collaborate';

	const response = await caller.books.create({
		title: title ? title : faker.commerce.productName() + ' But a Book',
		description: faker.commerce.productDescription(),
		genres: genres.length > 0 ? genres : new GenresBuilder().random(0.3).build(),
		permissions: {
			public: publicPermission
		},
		imageURL: `https://picsum.photos/id/${Math.floor(Math.random() * 1001)}/500/1000`
	});

	return response;
}

/**
 * Creates a campaign and returns the book object of the campaign
 * @param session
 * @returns
 */
export async function createCampaign(testSession: Session) {
	const caller = router.createCaller({ session: testSession });

	const publicPermission =
		new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>;
	publicPermission.permission = 'collaborate';

	const genres: Genre[] = [];
	const startDate = new Date();
	const endDate = new Date();
	const submissionCriteria =
		'Submit a 10 chapter storyline revolving around a prophesized hero in an unfamiliar world.';
	const rewards = 'Book publishing deal with Penguin!';

	const book: CreateBook = {
		title: faker.commerce.productName() + ' But a Book',
		description: faker.commerce.productDescription(),
		imageURL: `https://picsum.photos/id/${Math.floor(Math.random() * 1001)}/500/1000`,
		genres: genres.length > 0 ? genres : new GenresBuilder().random(0.3).build(),
		permissions: {
			public: publicPermission
		}
	};

	const campaignResponse = await caller.campaigns.create({
		startDate,
		endDate,
		submissionCriteria,
		rewards,
		book,
		origin: ''
	});

	const createdBook = (await caller.books.getById({ id: campaignResponse.data.book })).data;
	return createdBook;
}

export async function createChapter(
	session: Session,
	title: string,
	description: string,
	storyline: HydratedDocument<StorylineProperties>,
	prevChapterID?: string,
	comments?: boolean
) {
	const caller = router.createCaller({ session: session });

	const publicPermission =
		new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>;
	publicPermission.permission = 'collaborate';

	const response = await caller.chapters.create({
		title: title,
		description: description,
		storylineID: storyline._id,
		bookID: typeof storyline.book === 'string' ? storyline.book : storyline.book!._id,
		prevChapterID: prevChapterID,
		permissions: {
			public: publicPermission
		}
	});

	if (comments) {
		for (let i = 1; i < 15; i++) {
			caller.chapters.createComment({
				comment: faker.lorem.words(6),
				chapterId: response.data._id ?? ''
			});
		}
	}

	return response;
}

/**
 * Creates a test review
 * @param testSession
 * @returns
 */
export async function createReview(
	testSession: Session,
	itemID: string,
	reviewOf: ReviewOf,
	rating: Rating,
	title?: string,
	text?: string
) {
	const caller = router.createCaller({ session: testSession });

	const review = await caller.reviews.create({
		item: itemID,
		reviewOf,
		rating,
		title,
		text
	});

	return review;
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
				await collection.deleteMany({ $or: [{ _id: /^test-/ }, { email: /^test./ }] });
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
export async function createDBUser(session: Session, genres: Genre[] = []) {
	const caller = router.createCaller({ session });

	const supabaseUser = session.user;

	const userPropertyBuilder = new UserPropertyBuilder();
	const userProperties = userPropertyBuilder.getProperties();

	userProperties._id = '';
	userProperties.firstName = supabaseUser.user_metadata.firstName;
	userProperties.lastName = supabaseUser.user_metadata.lastName;
	userProperties.email = session.user.email;
	userProperties.about = faker.person.bio() + ' - ' + faker.lorem.paragraph();
	userProperties.imageURL = `https://picsum.photos/id/${Math.floor(Math.random() * 1001)}/500/1000`;
	userProperties.genres = genres;

	return await caller.users.create(userProperties);
}

export function getRandomElement<T>(list: T[] | readonly T[]): T {
	return list[Math.floor(Math.random() * list.length)];
}

export function getRandomKey(obj: Record<string, unknown>): string {
	const keys = Object.keys(obj);
	return keys[Math.floor(Math.random() * keys.length)];
}
