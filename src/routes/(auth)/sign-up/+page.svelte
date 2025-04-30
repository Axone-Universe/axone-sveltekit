<script lang="ts">
	import { type ToastSettings } from '@skeletonlabs/skeleton-svelte';

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import Container from '$lib/components/Container.svelte';
	import { toaster } from '$lib/util/toaster/toaster-svelte';

	export let data: PageData;
	const { supabase } = data;

	const formData = {
		email: '',
		password: '',
		confirmPassword: ''
	};

	async function signUpWithLinkedIn() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'linkedin'
		});

		if (error) {
			toaster.info({
				title: `Something wrong happened. Please try logging in later.`,
				type: 'error'
			});
		}
	}

	async function signUpWithGoogle() {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google'
		});

		if (error) {
			toaster.info({
				title: `Something wrong happened. Please try logging in later.`,
				type: 'error'
			});
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

		if (resp.error) {
			toaster.info({
				title: `Something wrong happened. Please try signing up later.`,
				type: 'error'
			});
			console.log(resp.error);
		} else {
			// TODO: handle if user already signed up
			console.log(resp.data);
			toaster.info({
				title: `Please check your inbox, confirm your email address, and then login.`,
				type: 'success'
			});
			goto('/login');
		}
	};
</script>

<Container class="flex h-screen justify-center items-center">
	<div class="w-full max-w-(--breakpoint-md) flex flex-col gap-8">
		<h1 class="text-center">Sign Up</h1>

		<button
			onclick="{signUpWithGoogle}"
			class="justify-center px-:4 py-2 border flex gap-2 border-slate-200 rounded-full text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow-sm transition duration-150"
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
			onclick="{signUpWithLinkedIn}"
			class="justify-center px-4 py-2 border flex gap-2 border-slate-200 rounded-full text-slate-700 hover:text-slate-900 hover:shadow-sm transition duration-150"
		>
			<img class="w-6 h-6" src="brand_logo/LI-In-Bug.png" loading="lazy" alt="linkedin logo" />
			<span class="text-white">Sign Up with linkedin</span>
		</button>

		<div class="justify-center text-center text-xl">or</div>

		<form class="flex flex-col items-end gap-4">
			<label class="label w-full">
				<span>Email</span>
				<input class="input" type="email" bind:value="{formData.email}" />
			</label>
			<label class="label w-full">
				<span>Password</span>
				<input class="input" type="password" bind:value="{formData.password}" />
			</label>
			<label class="label w-full">
				<span>Confirm password</span>
				<input class="input" type="password" bind:value="{formData.confirmPassword}" />
			</label>
			<div class="w-full text-center">
				<a class="underline text-xs" href="/login">Already have an account?</a>
				<a class="underline text-xs" href="/password/forgot">Forgot your password?</a>
			</div>
		</form>

		<footer class="flex justify-center">
			<a class="btn" href="/">Cancel</a>
			<button class="btn preset-filled-primary-500" onclick="{onSubmit}">Sign up</button>
		</footer>
	</div>
</Container>

<slot />
