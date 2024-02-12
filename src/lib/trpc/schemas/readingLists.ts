import { z } from 'zod';

export const readingList = z.object({
	title: z.string(),
	storylines: z.array(z.string())
});
