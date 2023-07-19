import type { Session, User } from '@supabase/supabase-js';

import { router } from '$lib/trpc/router';
import mongoose from 'mongoose';
import {
	TEST_MONGO_PASSWORD,
	TEST_MONGO_URL,
	TEST_MONGO_USER,
	TEST_MONGO_DB,
	MONGO_PASSWORD,
	MONGO_URL,
	MONGO_USER,
	MONGO_DB
} from '$env/static/private';

export const testUser: User = {
	id: '123',
	email: 'user@test.com',
	user_metadata: {},
	app_metadata: {},
	aud: '',
	created_at: ''
};

export const testSession: Session = {
	access_token: '',
	refresh_token: '',
	expires_in: 0,
	token_type: '',
	user: testUser
};

export const testUserInfo = { _id: '', firstName: 'Test', lastName: 'Userme', imageURL: '' };

export async function connectTestDatabase() {
	const options: mongoose.ConnectOptions = {
		dbName: TEST_MONGO_DB,
		user: TEST_MONGO_USER,
		pass: TEST_MONGO_PASSWORD
	};

	await mongoose.connect(TEST_MONGO_URL, options);
}

export async function connectDatabase() {
	const options: mongoose.ConnectOptions = {
		dbName: MONGO_DB,
		user: MONGO_USER,
		pass: MONGO_PASSWORD
	};

	await mongoose.connect(MONGO_URL, options);
}

export async function cleanUpDatabase() {
	console.log('dropping DB');

	/* Drop the DB */
	await mongoose.connection.db.dropDatabase();
}

export const createUser = async (session: Session) => {
	const caller = router.createCaller({ session });

	return await caller.users.create(testUserInfo);
};
