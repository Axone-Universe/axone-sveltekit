import { z } from 'zod';

export const readingList = z.object({
	title: z.string().optional(),
	storylines: z.array(z.string()).optional()
});
