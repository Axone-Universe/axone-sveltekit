import { z } from 'zod';

import { User } from '$lib/nodes/User';
import { Author } from '$lib/nodes/Author';
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
			assert(ctx.session?.user.id);
			assert(ctx.session.user.email);
			assert(ctx.session.user.user_metadata.name);

			const user = new User({
				id: ctx.session.user.id,
				name: ctx.session.user.user_metadata.name,
				email: ctx.session.user.email
			});

			const result = await user.create<User>();

			return result.records[0].get('properties');
		}),

	setAuthor: t.procedure
		.use(logger)
		.use(auth)
		.query(async ({ ctx }) => {
			assert(ctx.session?.user.id);

			const author = new Author(ctx.session.user.id);

			const result = await author.create<Author>();

			return result.records[0].get('properties');
		})
});
