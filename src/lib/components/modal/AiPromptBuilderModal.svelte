<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { modalStore } from '@skeletonlabs/skeleton';
	import { InputChip } from '@skeletonlabs/skeleton';
	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	export let store = modalStore;

	// Form Data
	const formData = {
		requestedLength: '',
		style: '',
		keywords: [],
		plotDirection: '',
		tone: '',
		targetAudience: '',
		targetLanguageProficiency: '',
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
					<option value="short sentence" selected>short sentence</option>
					<option value="long sentence">long sentence</option>
					<option value="short paragraph">short paragraph</option>
					<option value="long paragraph">long paragraph</option>
					<option value="short chapter">short chapter</option>
					<option value="long chapter">long chapter</option>
				</select>
			</label>

			<label class="label">
				<span>Style</span>
				<input
					class="input"
					type="text"
					bind:value={formData.style}
					placeholder="e.g. Formal or Casual"
				/>
			</label>

			<label class="label">
				<span>Keywords</span>
				<InputChip
					bind:value={formData.keywords}
					name="keywords"
					placeholder="Enter keywords to be included in the generation"
				/>
			</label>

			<label class="label">
				<span>Direction</span>
				<textarea
					class="textarea"
					bind:value={formData.plotDirection}
					placeholder="Plot direction you are seeking"
				/>
			</label>

			<label class="label">
				<span>Tone</span>
				<input
					class="input"
					type="text"
					bind:value={formData.tone}
					placeholder="e.g. Whimsical or light-hearted"
				/>
			</label>

			<label class="label">
				<span>Target Audience</span>
				<input
					class="input"
					type="text"
					bind:value={formData.targetAudience}
					placeholder="e.g. Young-adults"
				/>
			</label>

			<label class="label">
				<span>Target Language Proficiency</span>
				<input
					class="input"
					type="text"
					bind:value={formData.targetLanguageProficiency}
					placeholder="e.g. e.g. A-level equivalent english"
				/>
			</label>

			<label class="label">
				<span>Custom Prompt</span>
				<textarea
					class="textarea"
					bind:value={formData.customPrompt}
					placeholder="Custom text to send to the AI model"
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
