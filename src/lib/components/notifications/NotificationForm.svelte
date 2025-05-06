<script lang="ts">
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { type ToastSettings, getToastStore } from '@skeletonlabs/skeleton';
	import { type TopicNotificationProperties } from '$lib/properties/notification';
	import { type HydratedDocument } from 'mongoose';
	import { type BookProperties } from '$lib/properties/book';
	import { documentURL } from '$lib/util/links';
	import { onMount } from 'svelte';

	export let book: HydratedDocument<BookProperties>;
	export let cancelCallback: () => void = () => {
		history.back();
	};

	let customClass = '';
	export { customClass as class };

	const toastStore = getToastStore();

	let notification: TopicNotificationProperties = {
		url: documentURL($page.url.origin, 'Book', book),
		type: 'TOPIC',
		topicKey: 'general',
		topicName: 'general',
		subject: '',
		notification: ''
	};

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	async function createNotification() {
		let response;

		response = await trpc($page).notifications.notifyUsers.mutate({
			notifications: { general: notification }
		});

		const t: ToastSettings = {
			message: response.message,
			background: 'variant-filled-primary'
		};
		toastStore.trigger(t);
	}
</script>

<div class="{customClass} w-modal">
	<form on:submit|preventDefault={createNotification}>
		<div class="card p-2 sm:p-4 space-y-4">
			<div class="flex justify-between gap-2">
				<div class="flex flex-col w-full gap-2">
					<label for="book-title">* Notification Group</label>
					<select class="select">
						<option value="general" selected disabled> General </option>
					</select>
					<label for="book-title">* Notification Subject</label>
					<input
						id="title"
						class="input"
						type="text"
						bind:value={notification.subject}
						placeholder="e.g. Campaign Winners!"
						required
					/>
					<label for="book-description">* Redirect Link </label>
					<input
						id="title"
						class="input"
						type="url"
						bind:value={notification.url}
						placeholder="e.g. https://axone.network/book"
						required
					/>
					<label for="book-description">* Notification </label>
					{#await import('../TextArea.svelte')}
						{console.log('importing')}
					{:then component}
						<svelte:component
							this={component.default}
							placeholder=""
							maxLength={1000}
							bind:textContent={notification.notification}
						/>
					{/await}
				</div>
			</div>
			<div class="flex flex-col justify-end sm:flex-row gap-2">
				<button
					id="cancel-btn"
					type="button"
					class="btn variant-ghost-surface"
					on:click={cancelCallback}>Cancel</button
				>
				<button class="btn variant-filled" type="submit">Send Notification </button>
			</div>
		</div>
	</form>
</div>
