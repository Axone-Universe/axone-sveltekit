<script lang="ts">
	import { getModalStore, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome';
	import { questionCircle } from 'svelte-awesome/icons';

	export let bookCallback: () => void;
	export let campaignCallback: () => void;

	const modalStore = getModalStore();

	const campaignPopup: PopupSettings = {
		event: 'click',
		target: 'campaignPopup',
		placement: 'bottom'
	};
</script>

<div class="card p-4 flex flex-col gap-4 w-modal">
	<h3>Confirm Creation</h3>
	<p>
		You are about to create a book. Should this book be created as part of a new campaign?
		<button use:popup={campaignPopup}>
			<Icon data={questionCircle} />
		</button>
	</p>
	<div class="flex justify-end gap-2">
		<button class="btn variant-outline" on:click={() => modalStore.close()}>Cancel</button>
		<button class="btn variant-filled-surface" on:click={bookCallback}>No</button>
		<button class="btn variant-filled" on:click={campaignCallback}>Yes</button>
	</div>
	<div class="card p-4 w-72 shadow-xl z-50" data-popup="campaignPopup">
		<div class="flex flex-col gap-4">
			<p>
				A campaign is an event in which others are encouraged to create storylines following a
				specific theme or whatever criteria you like. This book will act as the entry point for
				participants to branch off of.
			</p>
		</div>
		<div class="arrow bg-surface-100-800-token" />
	</div>
</div>
