<script lang="ts">
	import { type ToastSettings } from '@skeletonlabs/skeleton-svelte';

	import type { PageData } from './$types';
	import Container from '$lib/components/Container.svelte';
	import { toaster } from '$lib/util/toaster/toaster-svelte';

	export let data: PageData;
	const { supabase } = data;

	const formData = {
		email: ''
	};

	const onSubmit = async () => {
		const resp = await supabase.auth.resetPasswordForEmail(formData.email, {
			redirectTo: 'http://localhost:5173/update-password' // TODO: change in prod
		});

		if (resp.error) {
			toaster.info({
				title: `Something wrong happened. Please try again later.`,
				type: 'error'
			});
			console.log(resp.error);
		} else {
			toaster.info({
				title: `Please check your inbox, confirm your email address, and then login.`,
				type: 'success'
			});
			console.log(resp.data);
		}
	};
</script>

<Container class="flex h-full justify-center items-center">
	<div class="w-full max-w-(--breakpoint-md) flex flex-col gap-8">
		<h1 class="text-center">Forgot Password</h1>
		<form class="flex flex-col items-end gap-4">
			<label class="label w-full">
				<span>Email</span>
				<input class="input" type="email" bind:value="{formData.email}" />
			</label>
		</form>

		<footer class="flex justify-center">
			<a class="btn" href="/">Cancel</a>
			<button class="btn preset-filled-primary-500" onclick="{onSubmit}">Send email</button>
		</footer>
	</div>
</Container>

<slot />
