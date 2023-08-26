import { label, type DeltaProperties } from '$lib/shared/delta';
import { label as ChapterLabel } from '$lib/shared/chapter';
import mongoose, { Schema, model, type PipelineStage } from 'mongoose';

export const deltaSchema = new Schema<DeltaProperties>({
	_id: { type: String, required: true },
	chapter: { type: String, ref: ChapterLabel, required: true },
	ops: Object
});

deltaSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

deltaSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	permissions(userID, pipeline);
	next();
});

function permissions(userID: string, pipeline: PipelineStage[]) {
	// permissions
	pipeline.push(
		{
			$lookup: {
				from: 'chapters',
				localField: 'chapter',
				foreignField: '_id',
				as: 'chapter'
			}
		},
		{
			$unwind: {
				path: '$chapter',
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$match: {
				$or: [
					{ 'chapter.published': true },
					{ ['chapter.permissions.' + userID]: { $exists: true } }
				]
			}
		}
	);
}

export const Delta = mongoose.models[label] || model<DeltaProperties>(label, deltaSchema);
