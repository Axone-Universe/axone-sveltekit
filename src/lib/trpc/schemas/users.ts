import { z } from 'zod';
import { genreSchema } from './genres';
import { USER_LABELS, type UserProperties } from '$lib/properties/user';

const UserSchema = z.enum(USER_LABELS);

export const userSchema = z.array(UserSchema);

export const create = z.object({
	_id: z.string(),
	firstName: z.string().min(1).optional(),
	lastName: z.string().min(1).optional(),
	imageURL: z.string().optional(),
	about: z.string().optional(),
	email: z.string().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	twitter: z.string().optional(),
	genres: genreSchema.optional(),
	labels: userSchema.optional()
}) satisfies z.ZodType<UserProperties>;

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.string().optional(),
	id: z.string().optional(),
	detail: z.string().optional()
});

export const update = z.object({
	_id: z.string(),
	firstName: z.string().min(1).optional(),
	lastName: z.string().min(1).optional(),
	imageURL: z.string().optional(),
	about: z.string().optional(),
	email: z.string().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	twitter: z.string().optional(),
	genres: genreSchema.optional(),
	labels: userSchema.optional()
});
