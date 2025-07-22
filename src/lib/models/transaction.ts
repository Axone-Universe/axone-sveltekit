import { label } from '$lib/properties/transaction';
import { label as AccountLabel } from '$lib/properties/account';
import { label as UserLabel } from '$lib/properties/user';
import mongoose, { PipelineStage, Schema, model } from 'mongoose';
import { addViewRestrictionPipeline } from './permission';
import { type TransactionProperties } from '$lib/properties/transaction';

export const transactionSchema = new Schema<TransactionProperties>({
	_id: String,
	hash: String,
	account: { type: String, ref: AccountLabel, required: true },
	receiver: { type: String, ref: UserLabel, required: true },
	sender: { type: String, ref: UserLabel, required: true },
	externalId: String,
	createdAt: Date,
	processedAt: Date,
	ref: String,
	status: String,
	type: String,
	xrplType: String,
	fee: Number,
	value: Number,
	netValue: Number,
	baseValue: Number,
	baseNetValue: Number,
	documentType: String,
	documentId: String,
	exchangeRate: Number,
	currency: String,
	currencyScale: Number,
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

	populate(pipeline);
	// TODO: add permissions logic
	next();
});

function populate(pipeline: PipelineStage[]) {
	pipeline.push(
		{
			$lookup: { from: 'users', localField: 'sender', foreignField: '_id', as: 'sender' }
		},
		{
			$unwind: {
				path: '$sender',
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$lookup: { from: 'users', localField: 'receiver', foreignField: '_id', as: 'receiver' }
		},
		{
			$unwind: {
				path: '$receiver',
				preserveNullAndEmptyArrays: true
			}
		}
	);
}

export const Transaction = mongoose.models[label]
	? model<TransactionProperties>(label)
	: model<TransactionProperties>(label, transactionSchema);
