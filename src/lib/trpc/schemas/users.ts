import { z } from 'zod';
import { genres } from './shared';

import type { CreateUser } from '$lib/util/types';

export const create = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	imageURL: z.string().optional(),
	about: z.string().optional(),
	userWriterChecked: z.boolean().optional(),
	userEditorChecked: z.boolean().optional(),
	userIllustratorChecked: z.boolean().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	twitter: z.string().optional(),
	genres: genres.optional()
}) satisfies z.ZodType<CreateUser>;
