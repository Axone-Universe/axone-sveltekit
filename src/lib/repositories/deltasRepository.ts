import { DBSession } from '$lib/db/session';
import type { Node } from 'neo4j-driver';
import { Repository } from '$lib/repositories/repository';
import type { DeltaNode, DeltaResponse } from '$lib/nodes/digital-assets/delta';

export class DeltasRepository extends Repository {
	constructor() {
		super();
	}

	async getById(id?: string): Promise<DeltaResponse> {
		const query = `
			MATCH (delta:Delta {id: '${id}'})
			RETURN delta
		`;

		const session = new DBSession();
		const result = await session.executeRead<DeltaResponse>(query);

		let delta: DeltaResponse;
		if (result.records.length > 0) {
			delta = result.records[0].toObject();
		}

		return new Promise<DeltaResponse>((resolve) => {
			resolve(delta);
		});
	}

	async getAll(limit?: number, skip?: number): Promise<DeltaNode[]> {
		throw new Error('not Implemented');
	}

	async getByTitle(title?: string, limit?: number, skip?: number): Promise<DeltaResponse[]> {
		throw new Error('not Implemented');
	}

	async count(): Promise<number> {
		const count = await this._count('Storyline');

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
