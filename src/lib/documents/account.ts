import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import { DocumentBuilder } from './documentBuilder';
import type { AccountProperties } from '$lib/properties/account';
import { Account } from '$lib/models/account';
import type mongoose from 'mongoose';

export class AccountBuilder extends DocumentBuilder<HydratedDocument<AccountProperties>> {
	private _sessionUserID?: string;
	private readonly _accountProperties: AccountProperties;

	constructor(id?: string) {
		super();
		this._accountProperties = {
			...{ _id: id ? id : ulid() },
			...(id ? {} : { currency: 'USD', currencyScale: 2, balance: 0 })
		};
	}

	userID(userID: string): AccountBuilder {
		this._accountProperties.user = userID;
		return this;
	}

	currency(currency: string): AccountBuilder {
		this._accountProperties.currency = currency;
		return this;
	}

	currencyScale(currencyScale: number): AccountBuilder {
		this._accountProperties.currencyScale = currencyScale;
		return this;
	}

	async update(): Promise<HydratedDocument<AccountProperties>> {
		if (!this._accountProperties._id)
			throw new Error('Must provide an accountID to update the account.');

		const account = await Account.findOneAndUpdate(
			{ _id: this._accountProperties._id },
			this._accountProperties,
			{ new: true }
		);

		return account as any;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		if (!this._accountProperties._id)
			throw new Error('Must provide a account ID to delete the account.');

		let result = {};

		result = await Account.deleteOne(
			{ _id: this._accountProperties._id },
			{ userID: this._sessionUserID }
		);

		return result as mongoose.mongo.DeleteResult;
	}

	async build(): Promise<HydratedDocument<AccountProperties>> {
		if (!this._accountProperties.user) throw new Error('Must provide a user to build the account.');

		console.log('<< saving account');

		let account = new Account(this._accountProperties);
		account = await account.save();
		console.log('<< account saved');

		return account;
	}
}
