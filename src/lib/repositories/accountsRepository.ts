import { Account } from '$lib/models/account';
import { Repository } from '$lib/repositories/repository';
import type { AccountProperties } from '$lib/properties/account';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';
import { AccountBuilder } from '$lib/documents/account';

export class AccountsRepository extends Repository {
	constructor() {
		super();
	}

	async getByUserId(
		userId: string,
		createIfNotFound?: boolean
	): Promise<HydratedDocument<AccountProperties>> {
		// We use exec here because cursor doesn't go through post middleware for aggregate
		const result = await Account.aggregate([{ $match: { user: userId } }]).exec();

		if (result.length === 0 && createIfNotFound) {
			const accountBuilder = new AccountBuilder().userID(userId);
			result.push(await accountBuilder.build());
		}

		return result[0];
	}

	async getById(session: Session | null, id: string): Promise<HydratedDocument<AccountProperties>> {
		// We use exec here because cursor doesn't go through post middleware for aggregate
		const result = await Account.aggregate([{ $match: { _id: id } }], {
			userID: session?.user.id
		}).exec();

		return result[0];
	}

	async get(limit?: number, skip?: number): Promise<HydratedDocument<AccountProperties>[]> {
		throw new Error('not Implemented');
	}

	async count(): Promise<number> {
		const count = await Account.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
