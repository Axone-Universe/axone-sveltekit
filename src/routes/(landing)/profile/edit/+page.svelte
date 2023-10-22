<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { UserProperties } from '$lib/properties/user';
	import UserProfileDetails from '$lib/components/user/UserProfileDetails.svelte';

	export let data: PageData;
	const { session, userProperties, supabase } = data;

	userProperties.about = userProperties.about ? userProperties.about : '';
	userProperties.email = session?.user.email;

	async function submit(userProperties: UserProperties) {
		await trpc($page).users.update.mutate(userProperties);

		// all good, redirect to newly-created profile
		await goto(`/profile/${session?.user.id}`);
	}

	const onSubmit = (userProperties: UserProperties) => {
		submit(userProperties);
	};

</script>

<Container class="mx-4  md:mx-40 xl:mx-96">
	<UserProfileDetails {onSubmit} {userProperties} {supabase} />
</Container>
