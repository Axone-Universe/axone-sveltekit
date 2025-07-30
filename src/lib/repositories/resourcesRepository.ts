import { Resource } from '$lib/models/resource';
import { Repository } from '$lib/repositories/repository';
import type { HydratedResourceProperties, ResourceProperties } from '$lib/properties/resource';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';
import { ReadResource } from '$lib/trpc/schemas/resources';

export class ResourcesRepository extends Repository {
	constructor() {
		super();
	}

	async get(
		session: Session | null,
		input: ReadResource
	): Promise<HydratedDocument<ResourceProperties>[]> {
		const pipeline = [];
		const filter: any = {};

		if (input.title) filter.title = { $regex: input.title, $options: 'i' };
		if (input.userID) filter.user = input.userID;
		if (input.chapterID) filter.chapter = input.chapterID;

		pipeline.push({ $match: filter });

		if (input.cursor) {
			pipeline.push({ $skip: (input.cursor ?? 0) + (input.skip ?? 0) });
		}

		if (input.limit) pipeline.push({ $limit: input.limit });

		const query = Resource.aggregate(pipeline, {
			userID: session?.user.id
		});

		return await query;
	}

	async getById(
		session: Session | null,
		id?: string
	): Promise<HydratedDocument<HydratedResourceProperties>> {
		const resource = await Resource.aggregate([{ $match: { _id: id } }], {
			userID: session?.user.id
		})
			.cursor()
			.next();

		return new Promise<HydratedDocument<HydratedResourceProperties>>((resolve) => {
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
