import { ulid } from 'ulid';
import { startSession, type HydratedDocument } from 'mongoose';
import { DocumentBuilder } from './documentBuilder';
import type { TransactionProperties } from '$lib/properties/transaction';
import { Transaction } from '$lib/models/transaction';
import type mongoose from 'mongoose';
import { CurrencyCode, TransactionStatus, TransactionType } from '$lib/util/types';
import { createHash } from 'crypto';
import { XummPostPayloadResponse } from 'xumm-sdk/dist/src/types';
import { Account } from '$lib/models/account';
import { currencies } from '$lib/util/constants';

export class TransactionBuilder extends DocumentBuilder<HydratedDocument<TransactionProperties>> {
	private _sessionUserID?: string;
	private readonly _transactionProperties: TransactionProperties;

	constructor(id?: string) {
		super();

		const newId = ulid();
		const hash = createHash('sha256').update(newId).digest('hex');

		this._transactionProperties = {
			_id: id ? id : newId,
			...(id
				? {}
				: {
						hash: hash,
						createdAt: new Date(),
						status: 'pending',
						type: 'Payment',
						fee: 0,
						value: 0,
						netValue: 0
				  })
		};
	}

	senderID(senderID: string): TransactionBuilder {
		this._transactionProperties.sender = senderID;
		return this;
	}

	receiverID(receiverID: string): TransactionBuilder {
		this._transactionProperties.receiver = receiverID;
		return this;
	}

	accountId(accountId: string): TransactionBuilder {
		this._transactionProperties.account = accountId;
		return this;
	}

	status(status: TransactionStatus): TransactionBuilder {
		this._transactionProperties.status = status;
		return this;
	}

	type(type: TransactionType): TransactionBuilder {
		this._transactionProperties.type = type;
		return this;
	}

	fee(fee: number): TransactionBuilder {
		this._transactionProperties.fee = fee;
		return this;
	}

	baseValue(baseValue: number): TransactionBuilder {
		this._transactionProperties.baseValue = baseValue;

		const currencyScale = currencies[this._transactionProperties.currency!].scale;
		this._transactionProperties.value = Number(
			(this._transactionProperties.exchangeRate! * baseValue).toFixed(currencyScale)
		);
		return this;
	}

	baseNetValue(baseNetValue: number): TransactionBuilder {
		this._transactionProperties.baseNetValue = baseNetValue;

		const currencyScale = currencies[this._transactionProperties.currency!].scale;
		this._transactionProperties.netValue = Number(
			(this._transactionProperties.exchangeRate! * baseNetValue).toFixed(currencyScale)
		);
		return this;
	}

	documentId(documentId: string): TransactionBuilder {
		this._transactionProperties.documentId = documentId;
		return this;
	}

	documentType(documentType: string): TransactionBuilder {
		this._transactionProperties.documentType = documentType;
		return this;
	}

	exchangeRate(exchangeRate: number): TransactionBuilder {
		this._transactionProperties.exchangeRate = exchangeRate;
		return this;
	}

	currency(currency: CurrencyCode): TransactionBuilder {
		this._transactionProperties.currency = currency;
		return this;
	}

	currencyScale(currencyScale: number): TransactionBuilder {
		this._transactionProperties.currencyScale = currencyScale;
		return this;
	}

	note(note: string): TransactionBuilder {
		this._transactionProperties.note = note;
		return this;
	}

	payload(payload: XummPostPayloadResponse): TransactionBuilder {
		this._transactionProperties.payload = payload;
		return this;
	}

	payloadId(payloadId: string): TransactionBuilder {
		this._transactionProperties.payloadId = payloadId;
		return this;
	}

	externalId(externalId: string): TransactionBuilder {
		this._transactionProperties.externalId = externalId;
		return this;
	}

	ref(ref: string): TransactionBuilder {
		this._transactionProperties.ref = ref;
		return this;
	}

	processedAt(processedAt: Date): TransactionBuilder {
		this._transactionProperties.processedAt = processedAt;
		return this;
	}

	async update(): Promise<HydratedDocument<TransactionProperties>> {
		if (!this._transactionProperties._id)
			throw new Error('Must provide an transactionID to update the transaction.');

		const session = await startSession();

		try {
			// create transaction
			const transaction = await Transaction.findOneAndUpdate(
				{ _id: this._transactionProperties._id },
				this._transactionProperties,
				{ new: true, session }
			);

			// update the account balance
			if (this._transactionProperties.status) {
				const accountTransactions = (await Transaction.aggregate([
					{
						$match: { account: transaction?.account }
					}
				])) as HydratedDocument<TransactionProperties>[];

				const balance = accountTransactions.reduce((currentBalance, transaction) => {
					if (transaction.status !== 'success') return currentBalance;

					const multiplier = transaction.type === 'Payment' ? 1 : -1;
					return currentBalance + multiplier * (transaction.baseNetValue ?? 0);
				}, 0);

				await Account.findOneAndUpdate(
					{ _id: transaction?.account },
					{ balance: balance },
					{ new: true, session }
				);
			}
		} finally {
			session.endSession();
		}

		const newTransaction = await Transaction.aggregate([
			{
				$match: {
					_id: this._transactionProperties._id
				}
			}
		])
			.cursor()
			.next();

		return newTransaction as any;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		if (!this._transactionProperties._id)
			throw new Error('Must provide a transaction ID to delete the transaction.');

		let result = {};

		result = await Transaction.deleteOne(
			{ _id: this._transactionProperties._id },
			{ userID: this._sessionUserID }
		);

		return result as mongoose.mongo.DeleteResult;
	}

	async build(): Promise<HydratedDocument<TransactionProperties>> {
		if (!this._transactionProperties.account)
			throw new Error('Must provide an account to build the transaction.');

		console.log('<< building txn');
		console.log(this._transactionProperties);

		let transaction = new Transaction(this._transactionProperties);
		transaction = await transaction.save();

		console.log('<< saved txn');
		return transaction;
	}
}
