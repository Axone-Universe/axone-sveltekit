<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { UserPropertyBuilder, type UserProperties } from '$lib/shared/user';
	import UserProfileDetails from '$lib/components/user/UserProfileDetails.svelte';
	import { user } from 'svelte-awesome/icons';

	export let data: PageData;
	const { session } = data;

	const aboutMaxLength = 500;

	const userPropertyBuilder = new UserPropertyBuilder();
	const userProperties = userPropertyBuilder.getProperties();
	userProperties.email = session?.user.email;

	$: if (userProperties.about!.length > aboutMaxLength) {
		userProperties.about = userProperties.about!.slice(0, aboutMaxLength);
	}

	async function submit(userProperties: UserProperties) {
		await trpc($page).users.create.mutate(userProperties);

		// all good, redirect to newly-created profile
		await goto(`/profile/${session?.user.id}`);
	}

	const onSubmit = (userProperties: UserProperties) => {
		console.log(userProperties);
		submit(userProperties);
	};
</script>

<Container class="mx-4 md:mx-40 xl:mx-96 mt-8">
	<UserProfileDetails {onSubmit} {userProperties} />
</Container>
