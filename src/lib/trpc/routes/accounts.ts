import { AccountBuilder } from '$lib/documents/account';
import { AccountProperties } from '$lib/properties/account';
import { AccountsRepository } from '$lib/repositories/accountsRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import type { Response } from '$lib/util/types';
import { HydratedDocument } from 'mongoose';
import { XummWebhookBody } from 'xumm-sdk/dist/src/types';
import { z } from 'zod';
import { auth } from '../middleware/auth';

export const accounts = t.router({
	get: t.procedure
		.use(auth)
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'account successfully obtained',
				data: {}
			};

			const accountsRepo = new AccountsRepository();

			// get the account
			const account = await accountsRepo.getById(ctx.session, input.id!);
			response.data = account;

			console.log('<< response');
			console.log(response);

			return {
				...response,
				...{ data: response.data as HydratedDocument<AccountProperties> }
			};
		}),
	getByUserId: t.procedure
		.use(auth)
		.input(z.object({ userId: z.string() }))
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'account successfully obtained',
				data: {}
			};

			const accountsRepo = new AccountsRepository();

			// get the account
			const account = await accountsRepo.getByUserId(input.userId!, true);
			response.data = account;

			console.log('<< response');
			console.log(response);

			return {
				...response,
				...{ data: response.data as HydratedDocument<AccountProperties> }
			};
		})
});
