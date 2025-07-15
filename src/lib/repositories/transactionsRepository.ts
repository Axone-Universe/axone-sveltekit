import { Transaction } from '$lib/models/transaction';
import { Repository } from '$lib/repositories/repository';
import type { TransactionProperties } from '$lib/properties/transaction';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';
import { ReadTransaction } from '$lib/trpc/schemas/transactions';

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

	async get(
		session: Session | null,
		input: ReadTransaction
	): Promise<HydratedDocument<TransactionProperties>[]> {
		const pipeline = [];
		const filter: any = {};

		if (input.accountId) filter.account = input.accountId;
		if (input.senderId) filter.sender = input.senderId;

		pipeline.push({ $match: filter });

		console.log('<< filter');
		console.log(filter);
		if (input.cursor) {
			pipeline.push({ $skip: (input.cursor ?? 0) + (input.skip ?? 0) });
		}

		if (input.limit) pipeline.push({ $limit: input.limit });

		const query = Transaction.aggregate(pipeline, {
			userID: session?.user.id
		});

		return await query;
	}

	getById(session: Session | null, id?: string): Promise<unknown> {
		throw new Error('Method not implemented.');
	}

	async count(): Promise<number> {
		const count = await Transaction.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
