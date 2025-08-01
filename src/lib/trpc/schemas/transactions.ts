import { z } from 'zod';

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	accountId: z.string().optional(),
	senderId: z.string().optional(),
	userId: z.string().optional()
});

export type ReadTransaction = z.infer<typeof read>;
