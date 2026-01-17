<script lang="ts">
	import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { UserProperties } from '$lib/properties/user';

	export let data: PageData;
	const { supabase } = data;

	const formData = {
		email: '',
		password: ''
	};

	const toastStore = getToastStore();

	async function signInWithLinkedIn() {
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

	async function signInWithFacebook() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'facebook'
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

	async function signInWithGoogle() {
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
		const supabaseResponse = await supabase.auth.signInWithPassword({
			email: formData.email,
			password: formData.password
		});

		let t: ToastSettings = {
			message: `Successfully logged in. Welcome!`,
			background: 'variant-filled-primary',
			autohide: true
		};

		if (supabaseResponse.error) {
			// TODO: move to event listener for authState change?
			if (supabaseResponse.error.message === 'Email not confirmed') {
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

			console.log(supabaseResponse.error);
			toastStore.trigger(t);
		} else {
			console.log(supabaseResponse.data);
			toastStore.trigger(t);
			if (supabaseResponse.data.user) {
				const usersResponse = await trpc($page).users.get.query({
					id: supabaseResponse.data.user.id
				});
				const users = usersResponse.data as HydratedDocument<UserProperties>[];
				if (users.length === 1 && users[0]._id === supabaseResponse.data.user.id) {
					// user already created profile - go to home page (later change to app home page)
					await goto('/');
				} else {
					// user does not have profile - go to profile page to create one
					await goto(`/profile/${supabaseResponse.data.user.id}`);
				}
			}
		}
	};
</script>

<Container class="flex h-screen justify-center items-center">
	<div class="w-full max-w-screen-md flex flex-col gap-8">

		<button
			on:click={signInWithGoogle}
			class="justify-center px-:4 py-2 border flex gap-2 rounded-full transition duration-150 variant-ghost"
		>
			<img
				class="w-6 h-6"
				src="/brand_logo/Google__G__Logo.svg.png"
				loading="lazy"
				alt="google logo"
			/>
			<span>Login with Google</span>
		</button>

		<button
			on:click={signInWithLinkedIn}
			class="justify-center px-4 py-2 border flex gap-2 rounded-full hover:shadow transition duration-150 variant-ghost"
		>
			<img class="w-6 h-6" src="/brand_logo/LI-In-Bug.png" loading="lazy" alt="linkedin logo" />
			<span>Login with LinkedIn</span>
		</button>

		<button
			on:click={signInWithFacebook}
			class="justify-center px-4 py-2 border flex gap-2 rounded-full hover:shadow transition duration-150 variant-ghost"
		>
			<img
				class="w-6 h-6"
				src="/brand_logo/Facebook_Logo_Primary.png"
				loading="lazy"
				alt="linkedin logo"
			/>
			<span>Login with Facebook</span>
		</button>

		<!-- <div class="justify-center text-center text-xl">or</div>

		<form class="flex flex-col items-end gap-4">
			<label class="label w-full">
				<span>Email</span>
				<input class="input" type="email" bind:value={formData.email} />
			</label>
			<label class="label w-full">
				<span>Password</span>
				<input class="input" type="password" bind:value={formData.password} />
			</label>
			<div class="w-full text-center">
				<a class="underline text-xs" href="/sign-up">Don't have an account?</a>
				<a class="underline text-xs" href="/password/forgot">Forgot your password?</a>
			</div>
		</form>

		<footer class="flex justify-center">
			<a class="btn" href="/">Cancel</a>
			<button class="btn variant-filled-primary" on:click={onSubmit}>Login</button>
		</footer> -->
	</div>
</Container>

<slot />
