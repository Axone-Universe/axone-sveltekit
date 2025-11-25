<script lang="ts">
	import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	import type { PageData } from './$types';
	import Container from '$lib/components/Container.svelte';

	export let data: PageData;
	const { supabase } = data;

	const toastStore = getToastStore();

	// Capture referral parameter on mount
	onMount(() => {
		const refParam = $page.url.searchParams.get('ref');
		if (refParam) {
			localStorage.setItem('axone-referral-id', refParam);
			console.log('Referral ID saved to localStorage:', refParam);
		}
	});

	async function signUpWithLinkedIn() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'linkedin'
		});

		let t: ToastSettings = {
			message: `Something wrong happened. Please try signing up later.`,
			background: 'variant-filled-error',
			autohide: true
		};

		if (await error) {
			toastStore.trigger(t);
		}
	}

	async function signUpWithFacebook() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'facebook'
		});

		let t: ToastSettings = {
			message: `Something wrong happened. Please try signing up later.`,
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
			message: `Something wrong happened. Please try signing up later.`,
			background: 'variant-filled-error',
			autohide: true
		};

		if (await error) {
			toastStore.trigger(t);
		}
	}
</script>

<Container class="flex h-screen justify-center items-center">
	<div class="w-full max-w-screen-md flex flex-col gap-8">
		<h1 class="text-center">Sign Up</h1>

		<button
			on:click={signUpWithGoogle}
			class="justify-center px-4 py-2 border flex gap-2 rounded-full transition duration-150 variant-ghost"
		>
			<img
				class="w-6 h-6"
				src="/brand_logo/Google__G__Logo.svg.png"
				loading="lazy"
				alt="google logo"
			/>
			<span>Sign Up with Google</span>
		</button>

		<button
			on:click={signUpWithLinkedIn}
			class="justify-center px-4 py-2 border flex gap-2 rounded-full hover:shadow transition duration-150 variant-ghost"
		>
			<img class="w-6 h-6" src="/brand_logo/LI-In-Bug.png" loading="lazy" alt="linkedin logo" />
			<span>Sign Up with LinkedIn</span>
		</button>

		<button
			on:click={signUpWithFacebook}
			class="justify-center px-4 py-2 border flex gap-2 rounded-full hover:shadow transition duration-150 variant-ghost"
		>
			<img
				class="w-6 h-6"
				src="/brand_logo/Facebook_Logo_Primary.png"
				loading="lazy"
				alt="facebook logo"
			/>
			<span>Sign Up with Facebook</span>
		</button>

		<!-- <div class="justify-center text-center text-xl">or</div>

		<form class="flex flex-col items-end gap-4">
			<label class="label w-full">
				<span>Email</span>
				<input class="input" type="email" />
			</label>
			<label class="label w-full">
				<span>Password</span>
				<input class="input" type="password" />
			</label>
			<label class="label w-full">
				<span>Confirm password</span>
				<input class="input" type="password" />
			</label>
			<div class="w-full text-center">
				<a class="underline text-xs" href="/login">Already have an account?</a>
				<a class="underline text-xs" href="/password/forgot">Forgot your password?</a>
			</div>
		</form>

		<footer class="flex justify-center">
			<a class="btn" href="/">Cancel</a>
			<button class="btn variant-filled-primary">Sign up</button>
		</footer> -->
	</div>
</Container>

<slot />
