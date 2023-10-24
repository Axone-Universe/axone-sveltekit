import { z } from 'zod';

export const collaboration = z.object({
	senderID: z.string(),
	receiverID: z.string(),
	documentName: z.string(),
	message: z.string()
});
