import { Transaction } from '$lib/models/transaction';
import { Repository } from '$lib/repositories/repository';
import type { TransactionProperties } from '$lib/properties/transaction';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';

export class TransactionsRepository extends Repository {
	constructor() {
		super();
	}

	async getByPayloadId(payloadId: string): Promise<HydratedDocument<TransactionProperties>> {
		// We use exec here because cursor doesn't go through post middleware for aggregate
		const result = await Transaction.aggregate([{ $match: { payloadId: payloadId } }]).exec();
		return result[0];
	}

	async getByAccountId(accountId: string): Promise<HydratedDocument<TransactionProperties>[]> {
		// We use exec here because cursor doesn't go through post middleware for aggregate
		const result = await Transaction.aggregate([{ $match: { account: accountId } }]).exec();
		return result;
	}

	getById(session: Session | null, id?: string): Promise<unknown> {
		throw new Error('Method not implemented.');
	}

	async get(limit?: number, skip?: number): Promise<HydratedDocument<TransactionProperties>[]> {
		throw new Error('not Implemented');
	}

	async count(): Promise<number> {
		const count = await Transaction.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
