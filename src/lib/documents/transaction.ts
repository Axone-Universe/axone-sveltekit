import { ulid } from 'ulid';
import { ClientSession, startSession, type HydratedDocument } from 'mongoose';
import { DocumentBuilder } from './documentBuilder';
import type { TransactionProperties } from '$lib/properties/transaction';
import { Transaction } from '$lib/models/transaction';
import type mongoose from 'mongoose';
import type {
	CurrencyCode,
	TransactionStatus,
	TransactionType,
	VisibleDocument,
	XrplTransactionType
} from '$lib/util/types';
import { createHash } from 'crypto';
import { XummPostPayloadResponse } from 'xumm-sdk/dist/src/types';
import { Account } from '$lib/models/account';
import { currencies } from '$lib/util/constants';
import { AccountProperties } from '$lib/properties/account';

export class TransactionBuilder extends DocumentBuilder<HydratedDocument<TransactionProperties>> {
	private _sessionUserID?: string;
	private readonly _transactionProperties: TransactionProperties;
	private _account?: HydratedDocument<AccountProperties> | null;
	private _accountCurrency?: CurrencyCode;

	get account(): HydratedDocument<AccountProperties> | undefined {
		return this._account ?? undefined;
	}

	get properties(): TransactionProperties {
		return this._transactionProperties;
	}

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

	xrplType(xrplType: XrplTransactionType): TransactionBuilder {
		this._transactionProperties.xrplType = xrplType;
		return this;
	}

	fee(fee: number): TransactionBuilder {
		this._transactionProperties.fee = fee;
		return this;
	}

	transferFee(transferFee: number): TransactionBuilder {
		this._transactionProperties.transferFee = transferFee;
		return this;
	}

	platformFee(platformFee: number): TransactionBuilder {
		this._transactionProperties.platformFee = platformFee;
		return this;
	}

	resource(resource: string): TransactionBuilder {
		this._transactionProperties.resource = resource;
		return this;
	}

	value(value: number): TransactionBuilder {
		this._transactionProperties.value = value;

		console.log('<< acc currency');
		console.log(this._accountCurrency);
		const currencyScale = currencies[this._accountCurrency!].scale;
		this._transactionProperties.baseValue = Number(
			(value / this._transactionProperties.exchangeRate!).toFixed(currencyScale)
		);

		return this;
	}

	netValue(netValue: number): TransactionBuilder {
		this._transactionProperties.netValue = netValue;

		const currencyScale = currencies[this._transactionProperties.currency!].scale;
		this._transactionProperties.baseNetValue = Number(
			(netValue / this._transactionProperties.exchangeRate!).toFixed(currencyScale)
		);

		// update value based on the fees
		this.value(
			netValue +
				(this._transactionProperties.fee ?? 0) +
				(this._transactionProperties.platformFee ?? 0)
		);
		return this;
	}

	documentId(documentId: string): TransactionBuilder {
		this._transactionProperties.documentId = documentId;
		return this;
	}

	documentType(documentType: VisibleDocument): TransactionBuilder {
		this._transactionProperties.documentType = documentType;
		return this;
	}

	exchangeRate(exchangeRate: number): TransactionBuilder {
		this._transactionProperties.exchangeRate = exchangeRate;
		return this;
	}

	accountCurrency(accountCurrency: CurrencyCode): TransactionBuilder {
		this._accountCurrency = accountCurrency;
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

	async updateAccountBalance(session: ClientSession, accountId: string) {
		const accountTransactions = (await Transaction.aggregate([
			{
				$match: { account: accountId }
			}
		])) as HydratedDocument<TransactionProperties>[];

		const balance = accountTransactions.reduce((currentBalance, transaction) => {
			if (transaction.type === 'Payment' && transaction.status !== 'success') return currentBalance;

			const multiplier = transaction.type === 'Withdrawal' ? -1 : 1;
			return currentBalance + multiplier * (transaction.baseNetValue ?? 0);
		}, 0);

		this._account = await Account.findOneAndUpdate(
			{ _id: accountId },
			{ balance: balance },
			{ new: true, session }
		);
	}

	async update(): Promise<HydratedDocument<TransactionProperties>> {
		if (!this._transactionProperties._id)
			throw new Error('Must provide an transactionID to update the transaction.');

		const session = await startSession();

		try {
			// create transaction
			const transaction =
				(await Transaction.findOneAndUpdate(
					{ _id: this._transactionProperties._id },
					this._transactionProperties,
					{ new: true, session }
				)) ?? undefined;

			// update the account balance
			if (this._transactionProperties.status) {
				await this.updateAccountBalance(session, transaction?.account ?? '');
			}
		} finally {
			session.endSession();
		}

		const transaction = await Transaction.aggregate([
			{
				$match: {
					_id: this._transactionProperties._id
				}
			}
		])
			.cursor()
			.next();

		return transaction as any;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		if (!this._transactionProperties._id)
			throw new Error('Must provide a transaction ID to delete the transaction.');

		let result = {};

		const session = await startSession();

		try {
			// get transaction account id
			const transaction = await Transaction.aggregate([
				{
					$match: {
						_id: this._transactionProperties._id
					}
				}
			])
				.cursor()
				.next();

			// delete transaction
			result = await Transaction.deleteOne(
				{ _id: this._transactionProperties._id },
				{ userID: this._sessionUserID, session: session }
			);

			await this.updateAccountBalance(session, transaction?.account ?? '');
		} finally {
			session.endSession();
		}

		return result as mongoose.mongo.DeleteResult;
	}

	async build(): Promise<HydratedDocument<TransactionProperties>> {
		if (!this._transactionProperties.account)
			throw new Error('Must provide an account to build the transaction.');

		console.log('<< building txn');
		console.log(this._transactionProperties);

		const session = await startSession();
		let transaction = new Transaction(this._transactionProperties);

		try {
			// create transaction
			transaction = await transaction.save({ session });

			// update the account balance if it's a withdrawal txn
			if (this._transactionProperties.type === 'Withdrawal') {
				await this.updateAccountBalance(session, transaction.account!);
			}
		} finally {
			session.endSession();
		}

		return transaction;
	}
}
