<script lang="ts">
	import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';

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

	const toastStore = getToastStore();

	async function signUpWithLinkedIn() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'linkedin'
		});

		let t: ToastSettings = {
			message: `Something wrong happened. Please try logging in later.`,
			background: 'variant-filled-error',
			autohide: true
		};

		if (await error) {
			toastStore.trigger(t);
		}
	}

	async function signUpWithGoogle() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google'
		});

		let t: ToastSettings = {
			message: `Something wrong happened. Please try logging in later.`,
			background: 'variant-filled-error',
			autohide: true
		};

		if (await error) {
			toastStore.trigger(t);
		}
	}

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

<Container class="flex h-screen justify-center items-center">
	<div class="w-full max-w-screen-md flex flex-col gap-8">
		<h1 class="text-center">Sign Up</h1>

		<button
			on:click={signUpWithGoogle}
			class="justify-center px-:4 py-2 border flex gap-2 border-slate-200 rounded-full text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow transition duration-150"
		>
			<img
				class="w-6 h-6"
				src="/brand_logo/Google__G__Logo.svg.png"
				loading="lazy"
				alt="google logo"
			/>
			<span class="text-white">Sign Up with Google</span>
		</button>
		<button
			on:click={signUpWithLinkedIn}
			class="justify-center px-4 py-2 border flex gap-2 border-slate-200 rounded-full text-slate-700 hover:text-slate-900 hover:shadow transition duration-150"
		>
			<img class="w-6 h-6" src="brand_logo/LI-In-Bug.png" loading="lazy" alt="linkedin logo" />
			<span class="text-white">Sign Up with linkedin</span>
		</button>

		<div class="justify-center text-center text-xl">or</div>

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
			<div class="w-full text-center">
				<a class="underline text-xs" href="/login">Already have an account?</a>
				<a class="underline text-xs" href="/password/forgot">Forgot your password?</a>
			</div>
		</form>

		<footer class="flex justify-center">
			<a class="btn" href="/">Cancel</a>
			<button class="btn variant-filled-primary" on:click={onSubmit}>Sign up</button>
		</footer>
	</div>
</Container>

<slot />
