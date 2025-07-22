import { label, type AccountProperties } from '$lib/properties/account';
import { label as TransactionLabel } from '$lib/properties/transaction';
import { label as UserLabel } from '$lib/properties/user';
import mongoose, { Schema, model } from 'mongoose';

export const accountSchema = new Schema<AccountProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel, required: true },
	currency: { type: String, required: true },
	currencyScale: { type: Number, required: true },
	// The balance is in the lowest unit e.g. cents
	balance: { type: Number, required: true }
});

accountSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

accountSchema.pre('aggregate', function (next) {
	// TODO: add permissions logic
	next();
});

export const Account = mongoose.models[label]
	? model<AccountProperties>(label)
	: model<AccountProperties>(label, accountSchema);
