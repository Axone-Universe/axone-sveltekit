import { z } from 'zod';

import { UserBuilder } from '$lib/nodes/user';
import { UsersRepository } from '$lib/repositories/UsersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';

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
			assert(ctx.session?.user.id && ctx.session.user.email && ctx.session.user.user_metadata.name);

			const userNode = await new UserBuilder()
				.id(ctx.session.user.id)
				.email(ctx.session.user.email)
				.name(ctx.session.user.user_metadata.name)
				.build();

			return userNode;
		})
});
