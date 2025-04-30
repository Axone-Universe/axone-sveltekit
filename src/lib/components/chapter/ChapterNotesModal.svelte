<script lang="ts">
	import { NotePropertyBuilder, type NoteProperties, TAGS, type Tag } from '$lib/properties/note';
	import { type ToastSettings, type ModalSettings, Tab, Tabs } from '@skeletonlabs/skeleton-svelte';
	import TextArea from '../TextArea.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { onMount } from 'svelte';
	import { edit, lock, plus, trash, search } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import { toaster } from '$lib/util/toaster/toaster-svelte';

	export let chapter: HydratedDocument<ChapterProperties>;
	export let disabled: false;

	let customClass = '';
	export { customClass as class };

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	let note: NoteProperties = new NotePropertyBuilder().getProperties();

	$: chapterNotes = chapter.chapterNotes ?? [];
	let filteredChapterNotes = chapter.chapterNotes ?? [];
	let chapterNotesList = '';
	let tabSet: number = 0;

	let closeModal = () => {
		modalStore.close();
	};

	function tagSelected(tag: Tag) {
		const index = note.tags!.indexOf(tag);
		if (index > -1) {
			note.tags = note.tags!.filter((v) => v !== tag);
		} else {
			note.tags = [...note.tags!, tag];
		}
	}

	let filterTag = '';
	function filterTagSelected(tag: Tag) {
		filterTag = tag;
		filteredChapterNotes = chapterNotes.filter((chapterNote) => {
			return chapterNote.tags!.includes(tag);
		});
	}

	let searchTerm = '';
	const searchNotes = (tag?: Tag) => {
		note = new NotePropertyBuilder().getProperties();

		// if filter was selected already, deselect it
		if (filterTag === tag) {
			filterTag = '';
			filteredChapterNotes = chapterNotes;
		} else if (tag) {
			filterTagSelected(tag);
		}

		filteredChapterNotes = (filterTag ? filteredChapterNotes : chapterNotes).filter(
			(chapterNote) => {
				let chapterNoteTitle = chapterNote.title.toLowerCase();
				const include = chapterNoteTitle.includes(searchTerm.toLowerCase());
				if (include && chapterNotesList === chapterNote._id) note = chapterNote;
				return include;
			}
		);
	};

	async function submit() {
		if (note._id) {
			updateNote();
		} else {
			createNote();
		}

		return false;
	}

	async function createNote() {
		let toastMessage = 'Creation Failed';
		let type = 'warning';

		trpc($page)
			.notes.create.mutate({
				title: note.title!,
				chapterID: chapter._id,
				note: note.note!,
				tags: note.tags
			})
			.then((response) => {
				toastMessage = 'Creation Successful';
				type = 'success';

				chapterNotes.push(response.data as HydratedDocument<NoteProperties>);
				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(chapterNotes) : '';
				}
				searchNotes();
			})
			.finally(() => {
				toaster.info({
					title: toastMessage,
					type: type
				});
			});
	}

	async function updateNote() {
		let toastMessage = 'Saving Failed';
		let type = 'warning';

		trpc($page)
			.notes.update.mutate({
				id: note._id,
				title: note.title!,
				note: note.note!,
				tags: note.tags
			})
			.then((noteResponse) => {
				toastMessage = 'Saving Successful';
				type = 'success';
			})
			.finally(() => {
				toaster.info({
					title: toastMessage,
					type: type
				});
			});
	}

	async function deleteNote(note: HydratedDocument<NoteProperties>) {
		let toastMessage = 'Deleting Failed';
		let type = 'warning';

		trpc($page)
			.notes.delete.mutate({
				id: note._id
			})
			.then((noteResponse) => {
				toastMessage = 'Deleting Successful';
				type = 'success';

				chapterNotes.splice(
					chapterNotes.findIndex((e) => e._id === note._id),
					1
				);
				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(chapterNotes) : '';
				}
				searchNotes();
			})
			.finally(() => {
				toaster.info({
					title: toastMessage,
					type: type
				});
			});
	}

	function chapterNoteSelected(chapterNote?: HydratedDocument<NoteProperties>) {
		tabSet = 1;
		if (chapterNote) {
			note = chapterNote;
		} else {
			note = new NotePropertyBuilder().getProperties();
		}
	}
</script>

<div class="{`modal-example-form card p-4 w-modal shadow-xl space-y-4 ${customClass}`}">
	<Tabs>
		<Tab bind:group="{tabSet}" name="tab1" value="{0}">Select Note</Tab>
		<Tab bind:group="{tabSet}" name="tab2" value="{1}"
			>{note.title != '' ? note.title : 'New Note'}</Tab
		>
		<!-- Tab Panels --->
		<svelte:fragment slot="panel">
			{#if tabSet === 0}
				<div class="p-8">
					<div>
						<div class="flex input px-4 my-4 items-center">
							<Icon data="{search}" scale="{1.2}" />
							<input
								class="input border-0 hover:bg-transparent"
								type="text"
								placeholder="e.g. Harry Potter"
								bind:value="{searchTerm}"
								on:input="{() => searchNotes()}"
							/>
						</div>
						<div class="space-x-2 my-4">
							{#each TAGS as tag}
								<button
									class="chip {tag === filterTag ? 'preset-filled' : 'preset-tonal'}"
									onclick="{() => searchNotes(tag)}"
									type="button"
								>
									{tag}
								</button>
							{/each}
						</div>
					</div>
					<div class="max-h-48 overflow-y-auto">
						<ListBox class="space-y-2">
							<ListBoxItem
								onclick="{() => chapterNoteSelected()}"
								bind:group="{chapterNotesList}"
								name="chapter"
								class="soft-listbox"
								value=""
							>
								<div class="flex justify-between items-center">
									<p class="line-clamp-1">New Note</p>
									<div class="space-x-4">
										<Icon data="{plus}" scale="{1.2}" />
									</div>
								</div>
							</ListBoxItem>
							{#each filteredChapterNotes as chapterNote}
								<ListBoxItem
									onclick="{() => chapterNoteSelected(chapterNote)}"
									bind:group="{chapterNotesList}"
									name="chapter"
									class="soft-listbox"
									value="{chapterNote._id}"
								>
									<div class="flex justify-between items-center">
										<p class="line-clamp-1">{chapterNote.title}</p>
										<div class="flex space-x-4">
											<button onclick|stopPropagation="{() => deleteNote(chapterNote)}">
												<Icon data="{trash}" scale="{1.2}" />
											</button>
										</div>
									</div>
								</ListBoxItem>
							{/each}
						</ListBox>
					</div>
				</div>
			{:else if tabSet === 1}
				<form on:submit|preventDefault="{submit}">
					<fieldset disabled="{disabled}">
						<div class="modal-form p-4 space-y-4 rounded-container">
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label>
								Select Tags

								<div class="space-x-2 my-4">
									{#each TAGS as tag}
										<button
											class="chip {note.tags && note.tags.includes(tag)
												? 'preset-filled'
												: 'preset-tonal'}"
											onclick="{() => tagSelected(tag)}"
											type="button"
										>
											{tag}
										</button>
									{/each}
								</div>
							</label>
							<label>
								* Title

								<input
									class="input"
									type="text"
									placeholder="e.g. Harry Potter"
									bind:value="{note.title}"
									required
								/>
							</label>

							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label>
								* Note
								<TextArea
									maxLength="{500}"
									bind:textContent="{note.note}"
									required="{true}"
									placeholder="e.g. Harry Potter is a boy aged 12 years old. He is kind, strong and loyal."
								/>
							</label>
						</div>
						{#if !disabled}
							<footer class="modal-footer flex justify-end space-x-2">
								<button
									onclick="{closeModal}"
									class="btn preset-tonal-surface border border-surface-500"
									type="button">Cancel</button
								>
								<button class="btn preset-filled" type="submit"
									>{note._id ? 'Update' : 'Create'}</button
								>
							</footer>
						{/if}
					</fieldset>
				</form>
			{/if}
		</svelte:fragment>
	</Tabs>
</div>
