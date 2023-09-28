import { z } from 'zod';

export const readingList = z.object({
	title: z.string(),
	books: z.record(z.string(), z.string()).optional()
});
