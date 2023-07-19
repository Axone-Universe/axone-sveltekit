import { z } from 'zod';
import { genres } from './shared';
import type { UserProperties, Users } from '$lib/shared/user';

export const users = z.object({
	Writer: z.boolean(),
	Illustrator: z.boolean(),
	Editor: z.boolean()
}) satisfies z.ZodType<Users>;

export const create = z.object({
	_id: z.string(),
	firstName: z.string().min(1).optional(),
	lastName: z.string().min(1).optional(),
	imageURL: z.string().optional(),
	about: z.string().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	twitter: z.string().optional(),
	genres: genres.optional(),
	labels: users.optional()
}) satisfies z.ZodType<UserProperties>;

export const update = z.object({
	_id: z.string(),
	firstName: z.string().min(1).optional(),
	lastName: z.string().min(1).optional(),
	imageURL: z.string().optional(),
	about: z.string().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	twitter: z.string().optional(),
	genres: genres.optional(),
	labels: users.optional()
});
