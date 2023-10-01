<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { InputChip, type ToastSettings, toastStore } from '@skeletonlabs/skeleton';
	import { Icon } from 'svelte-awesome';
	import { check, pencil } from 'svelte-awesome/icons';
	import type { StorageError } from '$lib/util/types';
	import type { BookProperties } from '$lib/shared/book';
	import type { HydratedDocument } from 'mongoose';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';
	import type { PermissionProperties } from '$lib/shared/permission';
	import type { PopupSettings } from '$lib/util/popup/types';
	import { popup } from '$lib/util/popup/popup';

	let input: HTMLInputElement;
	let image: HTMLElement;
	let imageFile: File;

	export let book: HydratedDocument<BookProperties>;
	export let supabase: SupabaseClient;

	let customClass = '';
	export { customClass as class };

	let genres = book.genres as unknown as Record<string, boolean>;

	let permissions: Map<string, HydratedDocument<PermissionProperties>> = new Map();

	async function createBook() {
		if (!imageFile) {
			createBookData(null);
			return;
		}

		// save the book-cover first
		supabase.storage
			.from('book-covers')
			.upload(imageFile.name, imageFile)
			.then((response: StorageError) => {
				if (response.data) {
					let urlData = supabase.storage.from('book-covers').getPublicUrl(response.data.path);
					createBookData(urlData.data.publicUrl);
				} else {
					let message = 'Error uploading book cover';
					switch (response.error.statusCode) {
						case '409': {
							message = 'Image already exists';
							let urlData = supabase.storage.from('book-covers').getPublicUrl(imageFile.name);
							createBookData(urlData.data.publicUrl);
							break;
						}
						default: {
							createBookData('');
							break;
						}
					}

					const t: ToastSettings = {
						message: message,
						background: 'variant-filled-error'
					};
					toastStore.trigger(t);
				}
			});
	}

	async function createBookData(imageURL: string | null) {
		if (imageURL) {
			book.imageURL = imageURL;
		}

		const perms = Object.assign({}, permissions, { user: '2' });

		console.log('** book create perms');
		console.log(Object.fromEntries(permissions));

		trpc($page)
			.books.create.mutate({
				title: book.title,
				description: book.description,
				imageURL: book.imageURL,
				genres: book.genres,
				permissions: Object.fromEntries(permissions) as any
			})
			.then((bookResponse) => {
				const t: ToastSettings = {
					message: 'Book created successfully',
					background: 'variant-filled-primary'
				};
				toastStore.trigger(t);
				goto(`/editor/${(bookResponse as HydratedDocument<BookProperties>)._id}`);
			});
	}

	/**
	 * Called when the image file upload changes and uploads an image
	 */
	function onImageChange() {
		if (input.files === null) {
			return;
		}

		imageFile = input.files[0];

		if (imageFile) {
			const reader = new FileReader();
			reader.addEventListener('load', function () {
				image.setAttribute('src', reader.result as string);
			});
			reader.readAsDataURL(imageFile);

			return;
		}
	}

	function filter(genre: string) {
		genres[genre] = !genres[genre];
	}

	function upload() {
		input.click();
	}

	let creatorsMenuList = [
		{ funct: upload, label: 'Upload Cover' },
		{ funct: adobeCreateCover, label: 'Create Cover' },
		{ funct: adobeEditCover, label: 'Edit Cover' }
	];

	async function adobeEditCover() {
		const ccEverywhere = await window.CCEverywhere.initialize({
			/* Get credentials at Adobe Developer Console.
                During beta, your client will need to be enabled. 
                Email your client ID (API Key) to amandah@adobe.com
                */
			clientId: '5d43d5ccb49f49c2ad04c1cc34f298a4',
			appName: 'Axone',
			appVersion: { major: 1, minor: 0 },
			platformCategory: 'web'
		});

		const createDesignCallback = {
			onCancel: () => {},
			onPublish: (publishParams) => {
				const localData = {
					project: publishParams.asset[0].projectId,
					image: publishParams.asset[0].data
				};
				//image.src = localData.image;
				//project_id = localData.project;

				//let img = document.getElementById('savedDesign');

				//let blob = new Blob(localData.image, {type: 'text/plain'});
				//img.src = URL.createObjectURL(blob);
				//console.log("Created from asset", localData, img);
				const t: ToastSettings = {
					message: 'Book created successfully',
					background: 'variant-filled-primary'
				};
				toastStore.trigger(t);
			},
			onError: (err) => {
				let t: ToastSettings = {
					message: `Something wrong happened. Please try again.`,
					background: 'variant-filled-error',
					autohide: true
				};

				toastStore.trigger(t);

				console.error('Error received is', err.toString());
			}
		};

		if (imageFile) {
			ccEverywhere.createDesign({
				callbacks: createDesignCallback,
				inputParams: {
					asset: {
						data: image.getAttribute('src'),
						dataType: 'base64',
						type: 'image'
					}
				},
				outputParams: {
					outputType: 'url'
				}
			});
		} else {
			console.log('no input image provided');
		}
		//ccEverywhere.terminate();
	}
	async function adobeCreateCover() {
		let ccEverywhere = await window.CCEverywhere.initialize({
		 
			clientId: '5d43d5ccb49f49c2ad04c1cc34f298a4',
			appName: 'Axone',
			appVersion: { major: 1, minor: 0 },
			platformCategory: 'web'
		});

		const createDesignCallback = {
			onCancel: () => {},
			onPublish: (publishParams) => {
				const localData = {
					project: publishParams.asset[0].projectId,
					image: publishParams.asset[0].data
				};

				imageFile = localData.image;
			
			
				//image_data.src = localData.image;
				//project_id = localData.project;
				console.log('Created from scratch', localData);
				const t: ToastSettings = {
					message: 'Book created successfully',
					background: 'variant-filled-primary'
				};
				toastStore.trigger(t);
			},
			onError: (err) => {
				let t: ToastSettings = {
					message: `Something wrong happened. Please try Again.`,
					background: 'variant-filled-error',
					autohide: true
				};

				toastStore.trigger(t);
				console.error('Error received is', err.toString());
			}
		};

		ccEverywhere.createDesign({
			callbacks: createDesignCallback,
			modalParams: {
				// borderRadius: 2,
				// padding: 2,
				// backgroundColor: 'purple',
				// size: {
				//     height: 500,
				//     width: 1000,
				//     unit: 'px'
				// }
			},
			inputParams: {
				editorPanelView: 'yourStuff'
				// panelSearchText: 'school'
			},
			outputParams: {
				outputType: 'base64'
			}
		});

		//ccEverywhere.terminate();
	}
	const popupSettings = (target: string) => {
		let settings: PopupSettings = {
			event: 'hover-popup',
			target: target,
			placement: 'bottom'
		};
		return settings;
	};
	const dropdownEditOptions: PopupSettings = popupSettings('dropdownEditOptions');
</script>

<div class={`${customClass}`}>
	<div class="card mx-2 w-5/6 md:w-2/6 aspect-[10/17] h-fit pb-2 card-hover">
		<div class="h-[87%]">
			<button use:popup={dropdownEditOptions}>
				<img
					bind:this={image}
					class="{imageFile ? '' : 'hidden'} object-cover w-full aspect-[5/8]"
					src=""
					alt="cover"
				/>
			</button>
		</div>
		<div data-popup="dropdownEditOptions" class="card p-4 w-fit">
			<ul class="list">
				{#each creatorsMenuList as menuItem}
					<li>
						<button on:click={menuItem.funct} class="w-full">{menuItem.label}</button>
					</li>
				{/each}
			</ul>
		</div>
		<footer class="flex flex-col items-center">
			<div class="overflow-hidden flex-auto flex items-center">
				<button
					use:popup={dropdownEditOptions}
					type="button"
					class="btn-icon bg-surface-200-700-token"
				>
					<Icon class="p-2" data={pencil} scale={2.5} />
				</button>
				<input on:change={onImageChange} bind:this={input} type="file" hidden />
			</div>
		</footer>
	</div>

	<form on:submit|preventDefault={createBook} class="card p-4 space-y-4 md:w-full">
		<label>
			* Book Title
			<input
				class="input"
				type="text"
				bind:value={book.title}
				placeholder="Untitled Book"
				required
			/>
		</label>
		<label>
			* Description
			<textarea class="textarea h-44 overflow-hidden" bind:value={book.description} required />
		</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			Genres
			<div class="space-x-4 space-y-4 w-full h-auto">
				{#each Object.keys(genres) as genre}
					<span
						class="chip {genres[genre] ? 'variant-filled' : 'variant-soft'}"
						on:click={() => {
							filter(genre);
						}}
						on:keypress
					>
						{#if genres[genre]}<span><Icon data={check} /></span>{/if}
						<span class="capitalize">{genre}</span>
					</span>
				{/each}
			</div>
		</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			Tags
			<InputChip bind:value={book.tags} name="tags" placeholder="Enter any value..." />
		</label>

		<div>
			Permissions
			<ManagePermissions {permissions} permissionedDocument={book} />
		</div>

		<div class="flex flex-col sm:flex-row gap-4">
			<a class="btn variant-filled-error" href="/campaigns">Cancel</a>
			<button class="btn variant-filled-primary" type="submit">Create Book</button>
		</div>
	</form>
</div>
