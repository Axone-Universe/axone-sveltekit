import { faker } from '@faker-js/faker';
import type { Session, User } from '@supabase/supabase-js';
import mongoose, { type HydratedDocument } from 'mongoose';
import { ulid } from 'ulid';

import { GenresBuilder, type Genre } from '$lib/properties/genre';
import type { StorylineProperties } from '$lib/properties/storyline';
import { router } from '$lib/trpc/router';

import { MONGO_PASSWORD, MONGO_URL, MONGO_USER, MONGO_DB } from '$env/static/private';
import { type UserProperties, UserPropertyBuilder } from '$lib/properties/user';
import type { Rating, ReviewOf } from '$lib/properties/review';
import { PermissionPropertyBuilder, type PermissionProperties } from '$lib/properties/permission';
import type { CreateBook } from '$lib/trpc/schemas/books';

/** Supabase Test User Infos */
export function generateUserSessionData(): User {
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
export async function createBook(
	session: Session,
	user: HydratedDocument<UserProperties>,
	title?: string,
	genres: Genre[] = []
) {
	const caller = router.createCaller({ session, user });

	const publicPermission =
		new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>;
	publicPermission.permission = 'collaborate';
	publicPermission._id = '';

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
export async function createCampaign(
	session: Session,
	user: HydratedDocument<UserProperties>,
	title?: string
) {
	const caller = router.createCaller({ session, user });

	const publicPermission =
		new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>;
	publicPermission.permission = 'collaborate';

	const genres: Genre[] = [];
	const startDate = new Date();
	const endDate = new Date();
	const criteria = [
		{
			value:
				'Submit a 10 chapter storyline revolving around a prophesized hero in an unfamiliar world.',
			link: ''
		}
	];
	const rewards = [{ value: 'Book publishing deal with Penguin!', link: '' }];

	const book: CreateBook = {
		title: title ?? faker.commerce.productName() + ' But a Book',
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
		criteria,
		rewards,
		book,
		origin: ''
	});

	const createdBook = (await caller.books.getById({ id: campaignResponse.data.book })).data;
	return createdBook;
}

export async function createChapter(
	session: Session,
	user: HydratedDocument<UserProperties>,
	title: string,
	description: string,
	storyline: HydratedDocument<StorylineProperties>,
	prevChapterID?: string,
	comments?: boolean
) {
	const caller = router.createCaller({ session, user });

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
	session: Session,
	user: HydratedDocument<UserProperties>,
	itemID: string,
	reviewOf: ReviewOf,
	rating: Rating,
	title?: string,
	text?: string
) {
	const caller = router.createCaller({ session, user });

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
export async function connectDatabase(DB_NAME?: string) {
	const options: mongoose.ConnectOptions = {
		dbName: DB_NAME ?? MONGO_DB,
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
export async function createDBUser(session: Session, genres: Genre[] = [], isAdmin?: boolean) {
	const caller = router.createCaller({ session, user: undefined });

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
	userProperties.admin = isAdmin;

	return await caller.users.create(userProperties);
}

export function getRandomElement<T>(list: T[] | readonly T[]): T {
	return list[Math.floor(Math.random() * list.length)];
}

export function getRandomKey(obj: Record<string, unknown>): string {
	const keys = Object.keys(obj);
	return keys[Math.floor(Math.random() * keys.length)];
}
