import { User } from '$lib/models/user';
import { Repository } from '$lib/repositories/repository';
import { label as StorylineLabel } from '$lib/properties/storyline';
import type { UserProperties } from '$lib/properties/user';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';

export class UsersRepository extends Repository {
	async get(session: Session | null, id?: string): Promise<HydratedDocument<UserProperties>[]> {
		const query = User.find(id ? { _id: id } : {});

		return await query;
	}

	async getById(
		session: Session | null,
		id?: string
	): Promise<HydratedDocument<UserProperties> | null> {
		const query = User.findById(id);

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
	async getByDetails(
		session: Session | null,
		searchTerm: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<UserProperties>[]> {
		let query = User.find({
			$or: [
				{ email: { $regex: '^' + searchTerm, $options: 'i' } },
				{ firstName: { $regex: '^' + searchTerm, $options: 'i' } },
				{ lastName: { $regex: '^' + searchTerm, $options: 'i' } }
			]
		});

		if (skip) {
			query = query.skip(skip);
		}

		if (limit) {
			query = query.limit(limit);
		}

		return await query;
	}

	async count(): Promise<number> {
		const count = await User.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
