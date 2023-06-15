import { DBSession } from '$lib/db/session';

export interface Count {
	count: number;
}

export abstract class Repository {
	abstract getById(searchTerm?: string, limit?: number, skip?: number): Promise<unknown>;
	abstract getByTitle(searchTerm?: string, limit?: number, skip?: number): Promise<unknown[]>;
	abstract count(): Promise<number>;
	protected async _count(label: string): Promise<number> {
		const query = `
			MATCH (:${label})
			RETURN count(*) as count
		`;

		const session = new DBSession();
		const result = await session.executeRead<Count>(query);

		const count: number = result.records[0].get('count');

		return new Promise<number>((resolve) => {
			resolve(Number(count));
		});
	}
}
