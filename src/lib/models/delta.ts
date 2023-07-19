import { label, type DeltaProperties } from '$lib/shared/delta';
import mongoose, { Schema, model } from 'mongoose';

export const deltaSchema = new Schema<DeltaProperties>({
	_id: { type: String, required: true },
	ops: Object
});

export const Delta = mongoose.models[label] || model<DeltaProperties>(label, deltaSchema);
