<script lang="ts">
	import { toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import type { UserProperties } from '$lib/nodes/base/NodeProperties';

	export let data: PageData;
	const { supabase } = data;

	const formData = {
		email: '',
		password: ''
	};

	const onSubmit = async () => {
		const resp = await supabase.auth.signInWithPassword({
			email: formData.email,
			password: formData.password
		});

		let t: ToastSettings = {
			message: `Successfully logged in. Welcome back!`,
			background: 'variant-filled-primary',
			autohide: true
		};

		if (resp.error) {
			// TODO: move to event listener for authState change?
			if (resp.error.message === 'Email not confirmed') {
				t = {
					message: `Please confirm your email address before logging in.`,
					background: 'variant-filled-error',
					autohide: true
				};
			} else {
				t = {
					message: `Something wrong happened. Please try logging in later.`,
					background: 'variant-filled-error',
					autohide: true
				};
			}
			console.log(resp.error);
			toastStore.trigger(t);
		} else {
			console.log(resp.data);
			toastStore.trigger(t);
			if (resp.data.user) {
				const users = (await trpc($page).users.list.query(resp.data.user.id)) as UserProperties[];
				if (users.length === 1 && users[0].id === resp.data.user.id) {
					await goto('/');
				} else {
					await goto('/create-profile');
				}
			}
		}
	};
</script>

<Container classes="flex h-full justify-center items-center">
	<div class="w-full max-w-screen-md flex flex-col gap-8">
		<h1>Login</h1>
		<form class="flex flex-col items-end gap-4">
			<label class="label w-full">
				<span>Email</span>
				<input class="input" type="email" bind:value={formData.email} />
			</label>
			<label class="label w-full">
				<span>Password</span>
				<input class="input" type="password" bind:value={formData.password} />
			</label>
			<a class="underline text-xs" href="/sign-up">Don't have an account?</a>
			<a class="underline text-xs" href="/forgot-password">Forgot your password?</a>
		</form>

		<footer class="flex justify-end">
			<a class="btn" href="/">Cancel</a>
			<button class="btn variant-filled-primary" on:click={onSubmit}>Login</button>
		</footer>
	</div>
</Container>

<slot />
