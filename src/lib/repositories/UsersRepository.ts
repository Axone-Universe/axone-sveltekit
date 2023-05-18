import { DBSession } from '$lib/db/session';
import type { UserResponse } from '$lib/nodes/user';

export class UsersRepository {
	async getUsers(uid?: string): Promise<UserResponse[]> {
		const query = `
			MATCH (user:User) 
			${uid ? `WHERE user.id = '${uid}'` : ''}
			RETURN user
		`;

		const session = new DBSession();
		const result = await session.executeRead<UserResponse>(query);

		const users: UserResponse[] = [];
		result.records.forEach((record) => {
			users.push(record.toObject());
		});

		return new Promise<UserResponse[]>((resolve) => {
			resolve(users);
		});
	}
}
