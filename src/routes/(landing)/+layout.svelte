<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-crimson.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/all.css';
	// Most of your app wide CSS should be put in this file
	import '../../app.postcss';

	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ supabase, session } = data);

	const onLogoutButtonClick = async () => {
		await supabase.auth.signOut();
	};
</script>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">Axone</strong>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				{#if session && session.user}
					<button class="btn variant-filled-primary" on:click={onLogoutButtonClick}>Logout</button>
				{:else}
					<div class="flex gap-2">
						<a class="btn variant-filled-primary" href="/login"> Login </a>
						<a class="btn variant-filled-primary" href="sign-up"> Sign up </a>
					</div>
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
