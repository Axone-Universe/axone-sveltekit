import { error, fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { UserResponse } from '$lib/nodes/user';
import { createUserSchema } from '$lib/util/schemas';
import { supabaseAdmin } from '$lib/util/supabase';

export const load = (async (event) => {
	const { data } = await supabaseAdmin.auth.admin.getUserById(event.params.id);
	const session = await event.locals.getSession();

	if (data && data.user) {
		// check if user has a profile
		const userResponse = (await trpc(event).users.list.query({
			searchTerm: event.params.id
		})) as UserResponse[];
		if (userResponse.length === 1) {
			const userNode = userResponse.pop()?.user;
			return { userNode };
		}
	}

	if (session?.user.id !== event.params.id)
		throw error(404, 'The requested user profile does not exist');
}) satisfies PageServerLoad;

export const actions = {
	// action to create or update user profile
	default: async (event) => {
		const data = await event.request.formData();

		const firstName = data.get('firstName');
		const lastName = data.get('lastName');
		const about = data.get('about');

		const userWriterChecked = data.get('userWriter') === 'on';
		const userEditorChecked = data.get('userEditor') === 'on';
		const userIllustratorChecked = data.get('userIllustrator') === 'on';

		const facebook = data.get('facebook');
		const instagram = data.get('instagram');
		const twitter = data.get('twitter');

		const fictional = data.get('fictional');
		const nonFictional = data.get('nonFictional');

		const parsedFictional = JSON.parse(fictional as string);
		const parsedNonFictional = JSON.parse(nonFictional as string);

		const possibleFormData = createUserSchema.safeParse({
			firstName,
			lastName,
			about,
			userWriterChecked,
			userEditorChecked,
			userIllustratorChecked,
			facebook,
			instagram,
			twitter,
			fictional: parsedFictional,
			nonFictional: parsedNonFictional
		});

		if (!possibleFormData.success) {
			console.log(possibleFormData.error.errors);
			return fail(400, { errors: possibleFormData.error.errors });
		}

		const session = await event.locals.getSession();
		if (!session) return fail(400);

		// TODO: remove the server action and just call the trpc query directly
		await trpc(event).users.create.mutate(possibleFormData.data);
	}
} satisfies Actions;
