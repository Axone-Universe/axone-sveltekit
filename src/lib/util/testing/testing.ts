import type { Session, User } from '@supabase/supabase-js';

import { DBSession } from '$lib/db/session';
import { router } from '$lib/trpc/router';

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

export const testUserInfo = { firstName: 'Test', lastName: 'User', imageURL: '' };

export async function cleanUpDatabase() {
	const session = new DBSession();
	const cypher = 'MATCH (n) DETACH DELETE n';
	await session.executeWrite(cypher);

	console.log('Database cleaned.');
}

export const createUser = async (session: Session) => {
	const caller = router.createCaller({ session });

	return await caller.users.create(testUserInfo);
};
