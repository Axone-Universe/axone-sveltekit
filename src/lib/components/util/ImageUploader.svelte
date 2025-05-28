<script context="module">
</script>

<script lang="ts">
	import type { PopupSettings, ToastSettings } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { paintBrush, pencil, remove, upload } from 'svelte-awesome/icons';
	import { getToastStore, popup } from '@skeletonlabs/skeleton';
	import type { RowAction } from '$lib/util/types';
	import { onMount } from 'svelte';

	export let imageURL: string | undefined;
	export let imageFile: File;
	let additionalClasses = '';
	export { additionalClasses as class };

	const toastStore = getToastStore();

	interface CustomWindow extends Window {
		CCEverywhere: any;
	}
	let customWindow: CustomWindow;

	let input: HTMLInputElement;
	let currentImagePath = imageURL ?? '';

	onMount(() => {
		customWindow = window as unknown as CustomWindow;
		checkSafariSettings();
	});

	let isSafari = true;
	let isIOS = false;
	let isMac = false;

	/**
	 * If
	 */
	function checkSafariSettings() {
		// Detect Safari and platform
		const ua = navigator.userAgent;

		isSafari = /^((?!chrome|android).)*safari/i.test(ua);
		isIOS = /iP(hone|od|ad)/.test(ua);
		isMac = /Macintosh/.test(ua);

		let message = '';
		if (isSafari) {
			message = `
				<div class="warning">
					${
						isIOS
							? `<p>
							It looks like you're using Safari on <strong>iOS</strong>. To enable full <strong>Book Cover Creation</strong> functionality:
						</p>
						<ol class="text-md font-thin list">
							<li>Open the <strong>Settings</strong> app</li>
							<li>Scroll down and tap <strong>Safari</strong></li>
							<li>Find the <strong>Privacy & Security</strong> section</li>
							<li>Disable <strong>Prevent Cross-Site Tracking</strong></li>
						</ol>`
							: isMac
							? `<p>
							It looks like you're using Safari on a <strong>Mac</strong>. To enable full <strong>Book Cover Creation</strong> functionality:
						</p>
						<ol class="text-md font-thin list">
							<li>Open Safari</li>
							<li>Go to <strong>Safari → Settings</strong> (or <strong>Preferences</strong>)</li>
							<li>Click the <strong>Privacy</strong> tab</li>
							<li>Uncheck <strong>Prevent cross-site tracking</strong></li>
						</ol>`
							: ``
					}
				</div>`;

			const t: ToastSettings = {
				message: message,
				autohide: false
			};
			toastStore.trigger(t);
		}
	}

	function removeImage() {
		currentImagePath = '';
		imageURL = '';
	}

	function onImageChange() {
		if (input.files === null) {
			return;
		}

		imageFile = input.files[0];
		if (imageFile) {
			const reader = new FileReader();
			reader.addEventListener('load', function () {
				currentImagePath = reader.result as string;
			});
			reader.readAsDataURL(imageFile);
		}
	}

	//Store ccEverywhere for initialisation between methods
	let ccEverywhere: any = null;
	//Used to check if adobe was initialised
	let adobeSDKIsInitialized = false;

	function uploadFile() {
		input.click();
	}

	let creatorsMenuList: RowAction[] = [
		// { callback: uploadFile, label: 'Upload', icon: upload },
		{ callback: adobeCreateCover, label: 'Create', icon: paintBrush }
	];

	async function adobeCreateCover() {
		if (!adobeSDKIsInitialized) {
			ccEverywhere = await customWindow.CCEverywhere.initialize(
				{
					clientId: '5d43d5ccb49f49c2ad04c1cc34f298a4',
					appName: 'Axone'
				}
				// { loginMode: 'delayed' }
			);

			adobeSDKIsInitialized = true;
		}

		const createDesignCallback = {
			onCancel: () => {},
			onLoadStart: () => {
				try {
					const ccERoot: any = [...document.body.children].find((c) =>
						c.tagName.toLowerCase().startsWith('cc-everywhere')
					);
					ccERoot.style.position = 'absolute';
					ccERoot.style.zIndex = 2000;
				} catch (err) {
					console.log('*** ERROR', err);
				}
			},
			onPublish: async (intent: any, publishParams: any) => {
				const localData = {
					project: publishParams.asset[0].projectId,
					image: publishParams.asset[0].data,
					fileName: publishParams.asset[0].fileName,
					fileType: publishParams.asset[0].fileType
				};

				const fileExtension = localData.fileType.split('/').pop();

				currentImagePath = localData.image;
				imageFile = await fetch(currentImagePath)
					.then((r) => r.blob())
					.then(
						(blobFile) =>
							new File([blobFile], localData.fileName + '.' + fileExtension, {
								type: blobFile.type
							})
					);

				console.log(localData);
			},
			onError: (err: any) => {
				let t: ToastSettings = {
					message: `Something wrong happened. Please try Again.`,
					background: 'variant-filled-error',
					autohide: true
				};

				toastStore.trigger(t);
				console.error('Error received is', err.toString());
			}
		};

		try {
			ccEverywhere.editor.create(
				{
					canvasSize: 'BookCover'
				},
				{
					selectedCategory: 'templates',
					templateType: 'photo-book',
					allowedFileTypes: ['image/jpeg'],
					multiPage: false,
					callbacks: createDesignCallback
				},
				[
					// {
					// 	id: 'download',
					// 	label: 'Download',
					// 	action: {
					// 		target: 'download',
					// 		publishFileType: 'image/jpeg'
					// 	},
					// 	style: {
					// 		uiType: 'button'
					// 	}
					// },
					{
						id: 'save-modified-asset',
						label: 'Use Book Cover',
						action: { target: 'publish' },
						style: { uiType: 'button' }
					}
				]
			);
		} catch (error: any) {
			console.log('** error');
			console.log(error);
			ccEverywhere.terminate();
		}
	}

	const popupSettings = (target: string) => {
		let settings: PopupSettings = {
			event: 'click',
			target: target,
			placement: 'bottom'
		};
		return settings;
	};
	const dropdownEditOptions: PopupSettings = popupSettings('dropdownEditOptions');
</script>

<div id="image-uploader-div" class={additionalClasses}>
	<img class="object-cover w-full" src={currentImagePath} alt="" />
	<div class="flex justify-center items-center gap-2 absolute inset-x-0 bottom-2">
		<button
			use:popup={dropdownEditOptions}
			type="button"
			class="btn-icon btn-icon-sm sm:btn-icon-base bg-surface-200-700-token"
		>
			<Icon class="p-2" data={pencil} scale={2.5} />
		</button>
		<button
			on:click={removeImage}
			type="button"
			class="btn-icon btn-icon-sm sm:btn-icon-base bg-surface-200-700-token"
		>
			<Icon class="p-2" data={remove} scale={2.5} />
		</button>
		<input on:change={onImageChange} bind:this={input} type="file" hidden />
	</div>
	<div data-popup="dropdownEditOptions" class="card p-2 w-fit">
		<div class="flex flex-col list justify-start">
			{#each creatorsMenuList as menuItem}
				<button on:click={menuItem.callback} class="w-full" type="button">
					<Icon class="p-2" data={menuItem.icon} scale={2.3} />
					{menuItem.label}
				</button>
			{/each}
		</div>
	</div>
</div>
