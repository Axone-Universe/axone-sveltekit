<script lang="ts">
	import { type ToastSettings } from '@skeletonlabs/skeleton-svelte';

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { UserProperties } from '$lib/properties/user';
	import { toaster } from '$lib/util/toaster/toaster-svelte';

	export let data: PageData;
	const { supabase } = data;

	const formData = {
		email: '',
		password: ''
	};

	async function signInWithLinkedIn() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'linkedin'
		});

		if (error) {
			toaster.error({
				title: `Something wrong happened. Please try logging in later.`,
				type: 'error'
			});
		}
	}

	async function signInWithFacebook() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'facebook'
		});

		if (error) {
			toaster.error({
				title: `Something wrong happened. Please try logging in later.`,
				type: 'error'
			});
		}
	}

	async function signInWithGoogle() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google'
		});

		let t: ToastSettings = {
			message: `Something wrong happened. Please try logging in later.`,
			background: 'preset-filled-error-500',
			autohide: true
		};

		if (error) {
			toaster.error({
				title: `Something wrong happened. Please try logging in later.`,
				type: 'error'
			});
		}
	}

	const onSubmit = async () => {
		const supabaseResponse = await supabase.auth.signInWithPassword({
			email: formData.email,
			password: formData.password
		});

		if (supabaseResponse.error) {
			// TODO: move to event listener for authState change?
			if (supabaseResponse.error.message === 'Email not confirmed') {
				toaster.info({
					title: `Please confirm your email address before logging in.`,
					type: 'error'
				});
			} else {
				toaster.info({
					title: `Something wrong happened. Please try logging in later.`,
					type: 'error'
				});
			}
		} else {
			console.log(supabaseResponse.data);
			toaster.info({
				title: `Successfully logged in. Welcome!`,
				type: 'success'
			});

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
	<div class="w-full max-w-(--breakpoint-md) flex flex-col gap-8">
		<h1 class="text-center">Login</h1>

		<button
			onclick="{signInWithGoogle}"
			class="justify-center px-:4 py-2 border flex gap-2 rounded-full transition duration-150 preset-tonal border border-surface-500"
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
			onclick="{signInWithLinkedIn}"
			class="justify-center px-4 py-2 border flex gap-2 rounded-full hover:shadow-sm transition duration-150 preset-tonal border border-surface-500"
		>
			<img class="w-6 h-6" src="/brand_logo/LI-In-Bug.png" loading="lazy" alt="linkedin logo" />
			<span>Login with LinkedIn</span>
		</button>

		<button
			onclick="{signInWithFacebook}"
			class="justify-center px-4 py-2 border flex gap-2 rounded-full hover:shadow-sm transition duration-150 preset-tonal border border-surface-500"
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
			<button class="btn variant-filled-primary" onclick={onSubmit}>Login</button>
		</footer> -->
	</div>
</Container>

<slot />
