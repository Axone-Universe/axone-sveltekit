import { Resource } from '$lib/models/resource';
import { Repository } from '$lib/repositories/repository';
import type { HydratedResourceProperties, ResourceProperties } from '$lib/properties/resource';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';
import { ReadResource } from '$lib/trpc/schemas/resources';
import { ulid } from 'ulid';
import type { Context } from '$lib/trpc/context';

export class ResourcesRepository extends Repository {
	constructor() {
		super();
	}

	async get(ctx: Context, input: ReadResource): Promise<HydratedDocument<ResourceProperties>[]> {
		const pipeline = [];
		const postPipeline = [];
		const filter: any = {};

		if (input.title) filter.title = { $regex: input.title, $options: 'i' };
		if (input.userID) filter.user = input.userID;
		if (input.chapterID) filter.chapter = input.chapterID;

		if (input.tags) {
			const nftCollections = [
				...(input.tags.includes('characters') ? ['characters'] : []),
				...(input.tags.includes('places') ? ['places'] : []),
				...(input.tags.includes('artifacts') ? ['artifacts'] : [])
			];

			if (input.tags.includes('newest')) {
				postPipeline.push({ $sort: { _id: -1 } });
			}

			if (input.tags.includes('listed')) {
				filter.isListed = true;
			}

			if (input.tags.includes('past 30 days')) {
				const ulid30 = ulid(this.getUnixTimeDaysAgo(30));
				filter._id = { $gt: ulid30 };
			}

			if (nftCollections.length > 0) {
				filter.nftCollection = { $in: nftCollections };
			}
		}

		pipeline.push({ $match: filter });

		if (input.cursor) {
			postPipeline.push({ $skip: (input.cursor ?? 0) + (input.skip ?? 0) });
		}

		if (input.limit) postPipeline.push({ $limit: input.limit });

		const query = Resource.aggregate(pipeline, {
			user: ctx.user,
			postPipeline: postPipeline
		});

		return await query;
	}

	getUnixTimeDaysAgo(days: number): number {
		const currentTime = Date.now();
		const millisecondsInADay = 86400_000;
		const thirtyDaysAgo = currentTime - days * millisecondsInADay;
		return thirtyDaysAgo;
	}

	async getById(ctx?: Context, id?: string): Promise<HydratedDocument<HydratedResourceProperties>> {
		const resource = await Resource.aggregate([{ $match: { _id: id } }], {
			user: ctx?.user
		})
			.cursor()
			.next();

		return new Promise<HydratedDocument<HydratedResourceProperties>>((resolve) => {
			resolve(resource);
		});
	}

	async getByIds(ctx: Context, ids: string[]): Promise<HydratedDocument<ResourceProperties>[]> {
		const resources = await Resource.aggregate([{ $match: { _id: { $in: ids } } }], {
			user: ctx.user
		});

		return new Promise<HydratedDocument<ResourceProperties>[]>((resolve) => {
			resolve(resources);
		});
	}

	async getByChapterID(
		ctx: Context,
		chapterID?: string
	): Promise<HydratedDocument<ResourceProperties>[]> {
		const resources = await Resource.aggregate([{ $match: { chapter: chapterID } }], {
			user: ctx.user
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
