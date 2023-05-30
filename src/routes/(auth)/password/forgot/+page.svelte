<script lang="ts">
	import { toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import type { PageData } from './$types';
	import Container from '$lib/components/Container.svelte';

	export let data: PageData;
	const { supabase } = data;

	const formData = {
		email: ''
	};

	const onSubmit = async () => {
		const resp = await supabase.auth.resetPasswordForEmail(formData.email, {
			redirectTo: 'http://localhost:5173/update-password'
		});

		let t: ToastSettings = {
			message: `Please check your inbox, confirm your email address, and then login.`,
			background: 'variant-filled-primary',
			autohide: true
		};

		if (resp.error) {
			t = {
				message: `Something wrong happened. Please try again later.`,
				background: 'variant-filled-error',
				autohide: true
			};
			console.log(resp.error);
		} else {
			console.log(resp.data);
		}

		toastStore.trigger(t);
	};
</script>

<Container class="flex h-full justify-center items-center">
	<div class="w-full max-w-screen-md flex flex-col gap-8">
		<h1>Forgot Password</h1>
		<form class="flex flex-col items-end gap-4">
			<label class="label w-full">
				<span>Email</span>
				<input class="input" type="email" bind:value={formData.email} />
			</label>
		</form>

		<footer class="flex justify-end">
			<a class="btn" href="/">Cancel</a>
			<button class="btn variant-filled-primary" on:click={onSubmit}>Send email</button>
		</footer>
	</div>
</Container>

<slot />
