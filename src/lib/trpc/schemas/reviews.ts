import { z } from 'zod';
import { REVIEW_OF } from '$lib/properties/review';

const reviewOfSchema = z.enum(REVIEW_OF);

export const create = z.object({
	item: z.string(),
	reviewOf: reviewOfSchema,
	// match Rating type but zod doesn't allow readonly of number array
	// so we have to validate manually here instead of using z.enum()
	rating: z.number().int().gte(1).lte(5),
	title: z.string().optional(),
	text: z.string().optional()
});

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	id: z.string().optional(),
	item: z.string().optional(),
	user: z.string().optional(),
	reviewOf: reviewOfSchema.optional(),
	rating: z.number().int().gte(1).lte(5).optional(),
	createDate: z.coerce.date().optional()
});

export const count = z.object({
	item: z.string().optional(),
	user: z.string().optional(),
	rating: z.number().int().gte(1).lte(5).optional()
});

export const update = z.object({
	id: z.string(),
	rating: z.number().int().gte(1).lte(5).optional(),
	title: z.string().optional(),
	text: z.string().optional()
});

export const single = z.object({
	id: z.string()
});

export const item = z.object({
	item: z.string()
});

export type CreateReview = z.infer<typeof create>;
export type ReadReview = z.infer<typeof read>;
export type UpdateReview = z.infer<typeof update>;
export type CountReview = z.infer<typeof count>;
export type SingleReview = z.infer<typeof single>;
export type ReviewByItem = z.infer<typeof item>;
