import { DBSession } from '$lib/db/session';
import type { UserProperties } from '$lib/nodes/base/NodeProperties';

export class UsersRepository {
	// TODO: supply the context i.e. user sessions, permissions etc
	// constructor() {}

	async getUsers(uid?: string): Promise<UserProperties[]> {
		const cypher = `MATCH (user:User) ${
			uid ? `WHERE user.id = '${uid}'` : ''
		} RETURN user{.*} AS properties`;

		const session = new DBSession();
		const result = await session.executeRead(cypher);
		const users: UserProperties[] = [];

		console.log(result.records);

		result.records.forEach((record) => {
			users.push(record.get('properties'));
		});

		return new Promise<UserProperties[]>((resolve) => {
			resolve(users);
		});
	}
}
