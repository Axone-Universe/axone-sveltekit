import { label } from '$lib/properties/transaction';
import { label as AccountLabel } from '$lib/properties/account';
import { label as UserLabel } from '$lib/properties/user';
import mongoose, { Schema, model } from 'mongoose';
import { addViewRestrictionPipeline } from './permission';
import { TransactionProperties } from '$lib/properties/transaction';

export const transactionSchema = new Schema<TransactionProperties>({
	_id: String,
	hash: String,
	account: { type: String, ref: AccountLabel, required: true },
	sender: { type: String, ref: UserLabel, required: true },
	externalId: String,
	createdAt: Date,
	processedAt: Date,
	ref: String,
	status: String,
	type: String,
	fee: Number,
	value: Number,
	netValue: Number,
	documentType: String,
	documentId: String,
	exchangeRate: Number,
	currency: String,
	note: String,
	payload: Object,
	payloadId: String
});

transactionSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

transactionSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	addViewRestrictionPipeline(userID, pipeline, 'transactions', 'transaction');
	next();
});

export const Transaction = mongoose.models[label]
	? model<TransactionProperties>(label)
	: model<TransactionProperties>(label, transactionSchema);
