<script lang="ts">
	import { type PopupSettings } from '@skeletonlabs/skeleton-svelte';
	import 'emoji-picker-element';
	// @ts-ignore Import module
	import insertText from 'https://cdn.jsdelivr.net/npm/insert-text-at-cursor@0.3.0/index.js';
	import { onMount } from 'svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { send, smileO } from 'svelte-awesome/icons';

	export let maxLength: number;
	export let placeholder: string = '';
	export let required: boolean = false;
	export let textContent: string = '';
	export let submitButton: boolean = false;
	export let submit: (textContent: string) => void = (textContent: string) => {};

	$: remaining = maxLength - (textContent ? textContent.length : 0);

	const emojiPopup: PopupSettings = {
		event: 'click',
		target: 'emojiPopup',
		placement: 'top'
	};

	onMount(() => {
		const picker = document.querySelector('emoji-picker');
		picker !== null &&
			picker.addEventListener('emoji-click', (e) => {
				insertText(document.querySelector('input'), e.detail.unicode);
			});
	});
</script>

<div>
	<textarea
		class="textarea resize-none"
		bind:value="{textContent}"
		maxlength="{maxLength}"
		required="{required}"
		placeholder="{placeholder}"></textarea>
	<div class="text-sm flex flex-row items-center gap-2 m-1 justify-between">
		<div class="flex flex-row items-center gap-2">
			<button use:popup="{emojiPopup}" type="button" class="btn-icon preset-tonal w-fit p-1"
				><Icon scale="{1.5}" class="w-fit" data="{smileO}" /></button
			>
			<p>Characters left: {remaining}</p>
		</div>
		{#if submitButton}
			<button
				onclick="{() => {
					submit(textContent);
				}}"
				type="button"
				class="btn preset-filled w-fit text-xs p-1">Submit</button
			>
		{/if}
	</div>
	<div class="card p-4 w-fit shadow-xl" data-popup="emojiPopup">
		<emoji-picker></emoji-picker>
	</div>
</div>
