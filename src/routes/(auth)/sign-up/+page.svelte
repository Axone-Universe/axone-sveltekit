<script lang="ts">
	import { toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import Container from '$lib/components/Container.svelte';

	export let data: PageData;
	const { supabase } = data;

	const formData = {
		email: '',
		password: '',
		confirmPassword: ''
	};

	const onSubmit = async () => {
		if (formData.password != formData.confirmPassword) {
			console.log("Passwords don't match!");
			return;
		}

		const resp = await supabase.auth.signUp({
			email: formData.email,
			password: formData.password
		});

		let t: ToastSettings = {
			message: `Please check your inbox, confirm your email address, and then login.`,
			background: 'variant-filled-primary',
			autohide: false
		};

		if (resp.error) {
			t = {
				message: `Something wrong happened. Please try signing up later.`,
				background: 'variant-filled-error',
				autohide: true
			};
			console.log(resp.error);
			toastStore.trigger(t);
		} else {
			// TODO: handle if user already signed up
			console.log(resp.data);
			toastStore.trigger(t);
			goto('/login');
		}
	};
</script>

<Container class="flex h-full justify-center items-center">
	<div class="w-full max-w-screen-md flex flex-col gap-8">
		<h1>Sign Up</h1>
		<form class="flex flex-col items-end gap-4">
			<label class="label w-full">
				<span>Email</span>
				<input class="input" type="email" bind:value={formData.email} />
			</label>
			<label class="label w-full">
				<span>Password</span>
				<input class="input" type="password" bind:value={formData.password} />
			</label>
			<label class="label w-full">
				<span>Confirm password</span>
				<input class="input" type="password" bind:value={formData.confirmPassword} />
			</label>
			<a class="underline text-xs" href="/login">Already have an account?</a>
			<a class="underline text-xs" href="/forgot-password">Forgot your password?</a>
		</form>

		<footer class="flex justify-end">
			<a class="btn" href="/">Cancel</a>
			<button class="btn variant-filled-primary" on:click={onSubmit}>Sign up</button>
		</footer>
	</div>
</Container>

<slot />
