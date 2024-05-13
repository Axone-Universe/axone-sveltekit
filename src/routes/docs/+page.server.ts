import { generateOpenAPIDocumentFromTRPCRouter } from 'openapi-trpc';
import type { PageServerLoad } from './$types';

import { router } from '$lib/trpc/router';

export const load = (async () => {
	const spec = generateOpenAPIDocumentFromTRPCRouter(router, {
		pathPrefix: '/trpc'
	});
	return { spec };
}) satisfies PageServerLoad;
/* 👇 */
