import { z } from 'zod';

import { AURA_DB } from '$env/static/private';
import { neo4jDriver } from '$lib/db/driver';
import type { UserProperties } from '$lib/nodes/base/NodeProperties';
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
		.input(z.string())
		.query(async ({ input, ctx }) => {
			const session = neo4jDriver.session({ database: AURA_DB });
			if (ctx.session && ctx.session.user) {
				null;
			}
		})
});
