<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { modalStore } from '@skeletonlabs/skeleton';
	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	export let store = modalStore;

	// Form Data
	const formData = {
		requestedLength: '',
		customPrompt: ''
	};

	// We've created a custom submit function to pass the response and close the modal.
	function onFormSubmit(): void {
		if ($store[0].response) $store[0].response(formData);
		store.close();
	}

	// Base Classes
	const cBase = 'card p-4 w-modal shadow-xl space-y-4';
	const cHeader = 'text-2xl font-bold';
	const cForm = 'border border-surface-500 p-4 space-y-4 rounded-container-token';
</script>

<!-- @component This example creates a simple form modal. -->
{#if $store[0]}
	<div class={cBase}>
		<header class={cHeader}>{$store[0].title ?? '(title missing)'}</header>
		<article>{$store[0].body ?? '(body missing)'}</article>
		<form class="modal-form {cForm}">
			<label class="label">
				<span>Generation length</span>
				<select required class="select" bind:value={formData.requestedLength}>
					<option value="Sentence" selected>Sentence</option>
					<option value="Long sentence">Long sentence</option>
					<option value="Paragraph">Paragraph</option>
				</select>
			</label>

			<label class="label">
				<span>Custom Prompt</span>
				<textarea
					class="textarea"
					bind:value={formData.customPrompt}
					rows="6"
					placeholder="
					Custom text to send to the AI model.
					
					e.g.
					The style of the chapter is ...
					The keywords to use in your response are ...
					The plot direction of the chapter is ...
					The tone of the chapter is ...
					The target audience of the chapter is ...
					The target language proficiency of the chapter is ...
					"
				/>
			</label>
		</form>
		<!-- prettier-ignore -->
		<footer class="modal-footer {parent.regionFooter}">
			<button class="btn {parent.buttonNeutral}" on:click={parent.onClose}>{parent.buttonTextCancel}</button>
			<button class="btn {parent.buttonPositive}" on:click={onFormSubmit}>Submit Form</button>
		</footer>
	</div>
{/if}
