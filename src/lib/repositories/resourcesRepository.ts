import { Resource } from '$lib/models/resource';
import { Repository } from '$lib/repositories/repository';
import type { ResourceProperties } from '$lib/properties/resource';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';

export class ResourcesRepository extends Repository {
	constructor() {
		super();
	}

	async getById(
		session: Session | null,
		id?: string
	): Promise<HydratedDocument<ResourceProperties>> {
		const resource = await Resource.aggregate([{ $match: { _id: id } }], {
			userID: session?.user.id
		})
			.cursor()
			.next();

		return new Promise<HydratedDocument<ResourceProperties>>((resolve) => {
			resolve(resource);
		});
	}

	async getByIds(
		session: Session | null,
		ids: string[]
	): Promise<HydratedDocument<ResourceProperties>[]> {
		const resources = await Resource.aggregate([{ $match: { _id: { $in: ids } } }], {
			userID: session?.user.id
		});

		return new Promise<HydratedDocument<ResourceProperties>[]>((resolve) => {
			resolve(resources);
		});
	}

	async getByChapterID(
		session: Session | null,
		chapterID?: string
	): Promise<HydratedDocument<ResourceProperties>[]> {
		const resources = await Resource.aggregate([{ $match: { chapter: chapterID } }], {
			userID: session?.user.id
		});

		return new Promise<HydratedDocument<ResourceProperties>[]>((resolve) => {
			resolve(resources);
		});
	}

	async getAll(limit?: number, skip?: number): Promise<HydratedDocument<ResourceProperties>[]> {
		throw new Error('not Implemented');
	}

	async getByTitle(
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<ResourceProperties>[]> {
		throw new Error('not Implemented');
	}

	async count(): Promise<number> {
		const count = await Resource.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
