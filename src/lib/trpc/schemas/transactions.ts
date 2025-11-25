import { z } from 'zod';

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	accountId: z.string().optional(),
	senderId: z.string().optional(),
	receiverId: z.string().optional(),
	userId: z.string().optional()
});

export type ReadTransaction = z.infer<typeof read>;

export const redeemReward = z.object({
	points: z.number(),
	rewardType: z.string(),
	rewardValue: z.number(),
	currency: z.enum(['XRP', 'USD', 'ZAR'])
});
