<script lang="ts">
	import { NotePropertyBuilder, type NoteProperties, TAGS, type Tag } from '$lib/properties/note';
	import {
		type ToastSettings,
		ListBox,
		ListBoxItem,
		type ModalSettings,
		getToastStore,
		getModalStore
	} from '@skeletonlabs/skeleton';
	import TextArea from '../TextArea.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { onMount } from 'svelte';
	import { edit, lock, plus, trash, search } from 'svelte-awesome/icons';
	import { Icon } from 'svelte-awesome';
	import type { ChapterProperties } from '$lib/properties/chapter';

	export let chapterNode: HydratedDocument<ChapterProperties>;
	export let disabled: false;

	let customClass = '';
	export { customClass as class };

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	let note: NoteProperties = new NotePropertyBuilder().getProperties();

	let chapterNotes: HydratedDocument<NoteProperties>[] = [];
	let filteredChapterNotes: HydratedDocument<NoteProperties>[] = [];
	let chapterNotesList = '';

	onMount(() => {
		getChapterNotes();
	});

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

	function getChapterNotes() {
		trpc($page)
			.notes.getByChapterID.query({
				chapterID: chapterNode._id
			})
			.then((response) => {
				chapterNotes = response.data as HydratedDocument<NoteProperties>[];
				filteredChapterNotes = response.data as HydratedDocument<NoteProperties>[];
			});
	}

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
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.notes.create.mutate({
				title: note.title!,
				chapterID: chapterNode._id,
				note: note.note!,
				tags: note.tags
			})
			.then((response) => {
				toastMessage = 'Creation Successful';
				toastBackground = 'bg-success-500';

				chapterNotes.push(response.data as HydratedDocument<NoteProperties>);
				searchNotes();
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
			});
	}

	async function updateNote() {
		let toastMessage = 'Saving Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.notes.update.mutate({
				id: note._id,
				title: note.title!,
				note: note.note!,
				tags: note.tags
			})
			.then((noteResponse) => {
				toastMessage = 'Saving Successful';
				toastBackground = 'bg-success-500';
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
			});
	}

	async function deleteNote(note: HydratedDocument<NoteProperties>) {
		let toastMessage = 'Deleting Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.notes.delete.mutate({
				id: note._id
			})
			.then((noteResponse) => {
				toastMessage = 'Deleting Successful';
				toastBackground = 'bg-success-500';

				chapterNotes.splice(
					chapterNotes.findIndex((e) => e._id === note._id),
					1
				);
				searchNotes();
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
			});
	}

	function chapterNoteSelected(chapterNote?: HydratedDocument<NoteProperties>) {
		if (chapterNote) {
			note = chapterNote;
		} else {
			note = new NotePropertyBuilder().getProperties();
		}
	}
</script>

<div class={`modal-example-form card p-4 w-modal shadow-xl space-y-4 ${customClass}`}>
	<form on:submit|preventDefault={submit}>
		<fieldset {disabled}>
			<div class="modal-form p-4 space-y-4 rounded-container-token">
				<!-- svelte-ignore a11y-label-has-associated-control -->
				<label>
					Select Tags

					<div class="space-x-2 my-4">
						{#each TAGS as tag}
							<button
								class="chip {note.tags && note.tags.includes(tag)
									? 'variant-filled'
									: 'variant-soft'}"
								on:click={() => tagSelected(tag)}
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
						bind:value={note.title}
						required
					/>
				</label>

				<!-- svelte-ignore a11y-label-has-associated-control -->
				<label>
					* Note
					<TextArea
						maxLength={500}
						bind:textContent={note.note}
						required={true}
						placeholder="e.g. Harry Potter is a boy aged 12 years old. He is kind, strong and loyal."
					/>
				</label>
			</div>
			{#if !disabled}
				<footer class="modal-footer flex justify-end space-x-2">
					<button on:click={closeModal} class="btn variant-ghost-surface" type="button"
						>Cancel</button
					>
					<button class="btn variant-filled" type="submit">{note._id ? 'Edit' : 'Create'}</button>
				</footer>
			{/if}
		</fieldset>
	</form>

	<hr class="opacity-100 mx-4" />

	<div class="p-4">
		<div>
			<div class="flex input px-4 my-4 items-center">
				<Icon data={search} scale={1.2} />
				<input
					class="input border-0 hover:bg-transparent"
					type="text"
					placeholder="e.g. Harry Potter"
					bind:value={searchTerm}
					on:input={() => searchNotes()}
				/>
			</div>
			<div class="space-x-2 my-4">
				{#each TAGS as tag}
					<button
						class="chip {tag === filterTag ? 'variant-filled' : 'variant-soft'}"
						on:click={() => searchNotes(tag)}
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
					on:change={() => chapterNoteSelected()}
					bind:group={chapterNotesList}
					name="chapter"
					class="soft-listbox"
					value=""
				>
					<div class="flex justify-between items-center">
						<p class="line-clamp-1">New Note</p>
						<div class="space-x-4">
							<Icon data={plus} scale={1.2} />
						</div>
					</div>
				</ListBoxItem>
				{#each filteredChapterNotes as chapterNote}
					<ListBoxItem
						on:change={() => chapterNoteSelected(chapterNote)}
						bind:group={chapterNotesList}
						name="chapter"
						class="soft-listbox"
						value={chapterNote._id}
					>
						<div class="flex justify-between items-center">
							<p class="line-clamp-1">{chapterNote.title}</p>
							<div class="flex space-x-4">
								<button on:click|stopPropagation={() => deleteNote(chapterNote)}>
									<Icon data={trash} scale={1.2} />
								</button>
							</div>
						</div>
					</ListBoxItem>
				{/each}
			</ListBox>
		</div>
	</div>
</div>
