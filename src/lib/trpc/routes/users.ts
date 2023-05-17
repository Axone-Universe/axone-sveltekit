import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UsersRepository } from '$lib/repositories/UsersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { User } from '$lib/nodes/User';

export const users = t.router({
	list: t.procedure
		.use(logger)
		.input(z.string().optional())
		.query(async ({ input }) => {
			const usersRepo = new UsersRepository();

			const result = await usersRepo.getUsers(input);

			return result;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.query(async ({ ctx }) => {
			// session should always be there since auth would have passed by now
			// but have to check anyway otherwise Typescript complains
			if (!ctx.session?.user.id || !ctx.session.user.email || !ctx.session.user.user_metadata.name)
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

			const user = new User({
				id: ctx.session.user.id,
				name: ctx.session.user.user_metadata.name,
				email: ctx.session.user.email
			});

			const result = await user.create<User>();

			return result.records[0].get('properties');
		})
});
