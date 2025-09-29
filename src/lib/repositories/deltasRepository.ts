import { Delta } from '$lib/models/delta';
import { Repository } from '$lib/repositories/repository';
import type { DeltaProperties } from '$lib/properties/delta';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';
import type { Context } from '$lib/trpc/context';

export class DeltasRepository extends Repository {
	constructor() {
		super();
	}

	async getById(ctx: Context, id?: string): Promise<HydratedDocument<DeltaProperties>> {
		// We use exec here because cursor doesn't go through post middleware for aggregate
		const result = await Delta.aggregate([{ $match: { _id: id } }], {
			user: ctx.user
		}).exec();

		return result[0];
	}

	async get(limit?: number, skip?: number): Promise<HydratedDocument<DeltaProperties>[]> {
		throw new Error('not Implemented');
	}

	async count(): Promise<number> {
		const count = await Delta.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
