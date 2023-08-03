<script lang="ts">
	import { toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { UserProperties } from '$lib/shared/user';

	export let data: PageData;
	const { supabase } = data;

	const formData = {
		email: '',
		password: ''
	};

	async function signInWithLinkedIn() {
  		const { data, error } = await supabase.auth.signInWithOAuth({
    		provider: 'linkedin',
    	})	

		if(error){
			console.log("Error : " + error);
		}else{
			console.log("Authenticated");
		}
	}

	async function signInWithGoogle() {
  		const { data, error } = await supabase.auth.signInWithOAuth({
    		provider: 'google',
    	})	

		if(error){
			console.log("Error : " + error);
		}else{
			console.log("Authenticated");
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
				const users = (await trpc($page).users.list.query({
					searchTerm: supabaseResponse.data.user.id
				})) as HydratedDocument<UserProperties>[];
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

<Container class="flex h-full justify-center items-center">
	<div class="w-full max-w-screen-md flex flex-col gap-8">
		<h1>Login</h1>

		<button on:click={signInWithGoogle}> google</button>
		<button on:click={signInWithLinkedIn}> linkedin</button>

		or


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
			<a class="underline text-xs" href="/password/forgot">Forgot your password?</a>
		</form>

		<footer class="flex justify-end">
			<a class="btn" href="/">Cancel</a>
			<button class="btn variant-filled-primary" on:click={onSubmit}>Login</button>
		</footer>
	</div>
</Container>

<slot />
