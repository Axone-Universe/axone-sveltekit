import { Delta } from '$lib/models/delta';
import { Repository } from '$lib/repositories/repository';
import type { DeltaProperties } from '$lib/shared/delta';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';

export class DeltasRepository extends Repository {
	constructor() {
		super();
	}

	async getById(session: Session | null, id?: string): Promise<HydratedDocument<DeltaProperties>> {
		const delta = await Delta.aggregate([{ $match: { _id: id } }])
			.cursor()
			.next();

		return new Promise<HydratedDocument<DeltaProperties>>((resolve) => {
			resolve(delta);
		});
	}

	async getAll(limit?: number, skip?: number): Promise<HydratedDocument<DeltaProperties>[]> {
		throw new Error('not Implemented');
	}

	async getByTitle(
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<DeltaProperties>[]> {
		throw new Error('not Implemented');
	}

	async count(): Promise<number> {
		const count = await Delta.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
