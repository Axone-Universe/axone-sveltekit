import { User } from '$lib/models/user';
import { Repository } from '$lib/repositories/repository';
import { label as StorylineLabel } from '$lib/properties/storyline';
import type { UserLabel, UserProperties } from '$lib/properties/user';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument, PipelineStage } from 'mongoose';
import type { Genre } from '$lib/properties/genre';
import { GetUsers } from '$lib/trpc/schemas/users';

export class UsersRepository extends Repository {
	async getById(
		session: Session | null,
		id?: string
	): Promise<HydratedDocument<UserProperties> | null> {
		const query = User.findById(id);

		return await query;
	}

	async getByEmail(
		session: Session | null,
		email?: string
	): Promise<HydratedDocument<UserProperties> | null> {
		const query = User.findOne({ email: email });
		return await query;
	}

	async getByIds(
		session: Session | null,
		ids?: string[]
	): Promise<HydratedDocument<UserProperties>[] | null> {
		const query = User.find({ _id: { $in: ids } });
		return await query;
	}

	async getReadingList(id: string, name?: string) {
		const query = await User.aggregate([
			{
				$match: { _id: id }
			},
			{
				$project: {
					item: 1,
					readingLists: { $objectToArray: '$readingLists' }
				}
			},
			{
				$unwind: '$readingLists'
			},
			...(name
				? [
						{
							$match: { 'readingLists.k': name }
						}
				  ]
				: []),
			{
				$lookup: {
					from: 'storylines',
					localField: 'readingLists.v',
					foreignField: '_id',
					as: 'storylines'
				}
			},
			{
				$unwind: '$storylines'
			},
			{
				$replaceRoot: { newRoot: '$storylines' }
			},
			{
				$lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' }
			},
			{
				$unwind: {
					path: '$user',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'book' }
			},
			{
				$unwind: {
					path: '$book',
					preserveNullAndEmptyArrays: true
				}
			}
		]);

		return query;
	}

	/**
	 * Performs a fuzzy search
	 * @param session
	 * @param uid
	 * @param limit
	 * @param skip
	 * @returns
	 */
	async get(session: Session | null, input: GetUsers): Promise<HydratedDocument<UserProperties>[]> {
		const filterQueries = [];

		if (input.detail) {
			filterQueries.push({
				$or: [
					{ email: { $regex: '^' + input.detail, $options: 'i' } },
					{ firstName: { $regex: '^' + input.detail, $options: 'i' } },
					{ lastName: { $regex: '^' + input.detail, $options: 'i' } }
				]
			});
		}

		if (input.cursor) {
			filterQueries.push({ _id: { $gt: input.cursor } });
		}

		if (input.genres && input.genres.length > 0) {
			filterQueries.push({ genres: { $all: input.genres } });
		}

		if (input.labels && input.labels.length > 0) {
			filterQueries.push({ labels: { $all: input.labels } });
		}

		const filter = { ...(filterQueries.length > 0 ? { $and: filterQueries } : {}) };
		let query = User.find(filter);

		if (input.cursor) {
			query = query.skip((input.cursor ?? 0) + (input.skip ?? 0));
		}

		if (input.limit) {
			query = query.limit(input.limit);
		}

		query.sort({ _id: 1 });

		return await query;
	}

	async count(): Promise<number> {
		const count = await User.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
