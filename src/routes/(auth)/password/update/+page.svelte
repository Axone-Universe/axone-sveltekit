<script lang="ts">
	import { type ToastSettings } from '@skeletonlabs/skeleton-svelte';

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import Container from '$lib/components/Container.svelte';
	import { toaster } from '$lib/util/toaster/toaster-svelte';

	export let data: PageData;
	const { supabase } = data;

	const formData = {
		password: '',
		confirmPassword: ''
	};

	const toastStore = getToastStore();

	const onSubmit = async () => {
		if (formData.password != formData.confirmPassword) {
			console.log("Passwords don't match!");
			return;
		}
		const resp = await supabase.auth.updateUser({
			password: formData.password
		});

		let t: ToastSettings = {
			message: `Password updated!`,
			background: 'preset-filled-primary-500',
			autohide: true
		};

		if (resp.error) {
			toaster.info({
				title: `Something wrong happened. Please try changing your password later.`,
				type: 'error'
			});
			console.log(resp.error);
		} else {
			toaster.info({
				title: `Password updated!`,
				type: 'success'
			});
			console.log(resp.data);
			goto('/');
		}
	};
</script>

<Container class="flex h-full justify-center items-center">
	<div class="w-full max-w-(--breakpoint-md) flex flex-col gap-8">
		<h1>Update Password</h1>
		<form class="flex flex-col items-end gap-4">
			<label class="label w-full">
				<span>Password</span>
				<input class="input" type="password" bind:value="{formData.password}" />
			</label>
			<label class="label w-full">
				<span>Confirm password</span>
				<input class="input" type="password" bind:value="{formData.confirmPassword}" />
			</label>
		</form>

		<footer class="flex justify-end">
			<button class="btn preset-filled-primary-500" onclick="{onSubmit}">Update</button>
		</footer>
	</div>
</Container>

<slot />
