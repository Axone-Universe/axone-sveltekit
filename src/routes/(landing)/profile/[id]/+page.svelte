<script lang="ts">
	import defaultUserImage from '$lib/assets/default-user.png'
	import Container from '$lib/components/Container.svelte';
	import { Avatar, Step, Stepper } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import type { FictionalGenres, NonFictionalGenres } from '$lib/util/types';

	export let data: PageData;
	export let { supabase, userNode } = data;
	export let form;

	const aboutMaxLength = 500;

	let profileImage = defaultUserImage

	let firstName = userNode?.properties.firstName ? userNode.properties.firstName : '';
	let firstNameError = false;
	let lastName = userNode?.properties.lastName ? userNode.properties.lastName : '';
	let lastNameError = false;
	let about = userNode?.properties.about ? userNode.properties.about : '';

	let userWriterChecked = !userNode || userNode.labels.indexOf('Writer') === -1 ? false : true;
	let userEditorChecked = !userNode || userNode?.labels.indexOf('Editor') === -1 ? false : true;
	let userIllustratorChecked =
		!userNode || userNode?.labels.indexOf('Illustrator') === -1 ? false : true;

	let fictionalGenres: FictionalGenres = {
		'Action & Adventure': false,
		Dystopian: false,
		Fantasy: false,
		Historical: false,
		Horror: false,
		Mystery: false,
		Romance: false,
		'Science Fiction': false,
		Thriller: false,
		'Young Adult': false
	};

	let nonFictionalGenres: NonFictionalGenres = {
		Autobiographies: false,
		Biographies: false,
		Historical: false,
		Journalism: false,
		'Self-help': false,
		Science: false,
		'Travel Guides': false
	};

	let facebook = userNode?.properties.facebook ? userNode.properties.facebook : '';
	let instagram = userNode?.properties.instagram ? userNode.properties.instagram : '';
	let twitter = userNode?.properties.twitter ? userNode.properties.twitter : '';

	if (userNode?.properties.fictional) {
		fictionalGenres = {
			'Action & Adventure':
				userNode.properties.fictional.indexOf('Action & Adventure') === -1 ? false : true,
			Dystopian: userNode.properties.fictional.indexOf('Dystopian') === -1 ? false : true,
			Fantasy: userNode.properties.fictional.indexOf('Fantasy') === -1 ? false : true,
			Historical: userNode.properties.fictional.indexOf('Historical') === -1 ? false : true,
			Horror: userNode.properties.fictional.indexOf('Horror') === -1 ? false : true,
			Mystery: userNode.properties.fictional.indexOf('Mystery') === -1 ? false : true,
			Romance: userNode.properties.fictional.indexOf('Romance') === -1 ? false : true,
			'Science Fiction':
				userNode.properties.fictional.indexOf('Science Fiction') === -1 ? false : true,
			Thriller: userNode.properties.fictional.indexOf('Thriller') === -1 ? false : true,
			'Young Adult': userNode.properties.fictional.indexOf('Young Adult') === -1 ? false : true
		};
	}

	if (userNode?.properties.nonFictional) {
		nonFictionalGenres = {
			Autobiographies:
				userNode.properties.nonFictional.indexOf('Autobiographies') === -1 ? false : true,
			Biographies: userNode.properties.nonFictional.indexOf('Biographies') === -1 ? false : true,
			Historical: userNode.properties.nonFictional.indexOf('Historical') === -1 ? false : true,
			Journalism: userNode.properties.nonFictional.indexOf('Journalism') === -1 ? false : true,
			'Self-help': userNode.properties.nonFictional.indexOf('Self-help') === -1 ? false : true,
			Science: userNode.properties.nonFictional.indexOf('Science') === -1 ? false : true,
			'Travel Guides':
				userNode.properties.nonFictional.indexOf('Travel Guides') === -1 ? false : true
		};
	}

	$: fictional = JSON.stringify(fictionalGenres);
	$: nonFictional = JSON.stringify(nonFictionalGenres);

	$: if (about.length > aboutMaxLength) {
		about = about.slice(0, aboutMaxLength);
	}

	$: if (form) {
		for (let i = 0; i < form.errors.length; i++) {
			if (form.errors[i].path[0] === 'firstName') {
				firstNameError = true;
			} else if (form.errors[i].path[0] === 'lastName') {
				lastNameError = true;
			}
		}
	}
</script>

<Container>
	<!-- Hidden form for submission -->
	<div hidden={userNode === undefined}>
		<form method="POST" class="space-y-8">
			<h1>My Profile</h1>
			<h2>Basic Information</h2>
			<div class="space-y-2">
				<Avatar
					src={profileImage}
					width="w-32"
					rounded="rounded-full"
				/>
				<label>
					First name
					<input name="firstName" class="input" type="text" bind:value={firstName} />
				</label>
				<label>
					Last name
					<input name="lastName" class="input" type="text" bind:value={lastName} />
				</label>
				<label>
					About
					<textarea name="about" class="textarea" bind:value={about} />
				</label>
			</div>

			<h2 class="my-8">Genre Preferences</h2>
			<div>
				<label hidden>
					Fictional genre preferences
					<input name="fictional" class="input" type="text" bind:value={fictional} />
				</label>
				<label hidden>
					Non-fictional genre preferences
					<input name="nonFictional" class="input" type="text" bind:value={nonFictional} />
				</label>
				<div class="space-y-4">
					<h3>Fiction</h3>
					<div class="flex flex-wrap gap-2">
						{#each Object.keys(fictionalGenres) as genre}
							<span
								class="chip {fictionalGenres[genre] ? 'variant-filled' : 'variant-soft'}"
								on:click={() => {
									fictionalGenres[genre] = !fictionalGenres[genre];
								}}
								on:keypress
							>
								<span>{genre}</span>
							</span>
						{/each}
					</div>
					<h3>Non-fiction</h3>
					<div class="flex flex-wrap gap-2">
						{#each Object.keys(nonFictionalGenres) as genre}
							<span
								class="chip {nonFictionalGenres[genre] ? 'variant-filled' : 'variant-soft'}"
								on:click={() => {
									nonFictionalGenres[genre] = !nonFictionalGenres[genre];
								}}
								on:keypress
							>
								<span>{genre}</span>
							</span>
						{/each}
					</div>
				</div>
			</div>

			<h2 class="my-8">User Role</h2>
			<div class="space-y-2">
				<label class="flex items-center space-x-2">
					<input
						name="userWriter"
						class="checkbox"
						type="checkbox"
						bind:checked={userWriterChecked}
					/>
					<p>
						Writer - I want to write content whether for myself or in collaboration with others.
					</p>
				</label>
				<label class="flex items-center space-x-2">
					<input
						name="userEditor"
						class="checkbox"
						type="checkbox"
						bind:checked={userEditorChecked}
					/>
					<p>Editor - I want to help other writers edit their work to uphold high standards.</p>
				</label>
				<label class="flex items-center space-x-2">
					<input
						name="userIllustrator"
						class="checkbox"
						type="checkbox"
						bind:checked={userIllustratorChecked}
					/>
					<p>Illustrator - I want to create illustrative content for written work by writers.</p>
				</label>
			</div>
			<h2 class="mt-8">Social Media</h2>
			<div class="space-y-2">
				<label>
					Facebook profile link
					<input name="facebook" class="input" type="text" bind:value={facebook} />
				</label>
				<label>
					Instagram handle
					<input name="instagram" class="input" type="text" bind:value={instagram} />
				</label>
				<label>
					Twitter handle
					<input name="twitter" class="input" type="text" bind:value={twitter} />
				</label>
			</div>
			<button
				id="userProfileSubmitButton"
				class="btn variant-filled-primary mt-8"
				hidden={data.id === data.session?.user.id}>Update Profile</button
			>
		</form>
	</div>

	<!-- User has not created profile yet -->
	<div hidden={userNode !== undefined}>
		<Stepper on:complete={() => document.getElementById('userProfileSubmitButton')?.click()}>
			<Step locked={firstName.length === 0 || lastName.length === 0}>
				<svelte:fragment slot="header">Basic Information</svelte:fragment>
				<Avatar
					src={profileImage}
					width="w-24"
					rounded="rounded-full"
				/>
				<label>
					*First name
					<input class="input" type="text" bind:value={firstName} />
					{#if firstNameError}<p class="text-error-500">First name is required.</p>{/if}
				</label>

				<label>
					*Last name
					<input class="input" type="text" bind:value={lastName} />
					{#if lastNameError}<p class="text-error-500">Last name is required.</p>{/if}
				</label>

				<label>
					About
					<textarea class="textarea" bind:value={about} />
				</label>
				<div class="text-sm">Characters left: {aboutMaxLength - about.length}</div>
			</Step>
			<Step>
				<svelte:fragment slot="header">Genre Preferences</svelte:fragment>
				<div class="text-xl">Fiction</div>
				<div class="flex flex-wrap gap-2">
					{#each Object.keys(fictionalGenres) as genre}
						<span
							class="chip {fictionalGenres[genre] ? 'variant-filled' : 'variant-soft'}"
							on:click={() => {
								fictionalGenres[genre] = !fictionalGenres[genre];
							}}
							on:keypress
						>
							<span>{genre}</span>
						</span>
					{/each}
				</div>
				<div class="text-xl">Non-fiction</div>
				<div class="flex flex-wrap gap-2">
					{#each Object.keys(nonFictionalGenres) as genre}
						<span
							class="chip {nonFictionalGenres[genre] ? 'variant-filled' : 'variant-soft'}"
							on:click={() => {
								nonFictionalGenres[genre] = !nonFictionalGenres[genre];
							}}
							on:keypress
						>
							<span>{genre}</span>
						</span>
					{/each}
				</div>
			</Step>
			<Step>
				<svelte:fragment slot="header">User Role</svelte:fragment>
				<div>
					You can have multiple roles as a user on the Axone platform. You are given the Reader role
					by default and you can have Writer, Editor, and Illustrator as additional roles. These
					roles are important for determining how we can provide you exposure should you be looking
					to collaborate on the platform.
				</div>
				<label class="flex items-center space-x-2">
					<input class="checkbox" type="checkbox" bind:checked={userWriterChecked} />
					<p>
						Writer - I want to write content whether for myself or in collaboration with others.
					</p>
				</label>
				<label class="flex items-center space-x-2">
					<input class="checkbox" type="checkbox" bind:checked={userEditorChecked} />
					<p>Editor - I want to help other writers edit their work to uphold high standards.</p>
				</label>
				<label class="flex items-center space-x-2">
					<input class="checkbox" type="checkbox" bind:checked={userIllustratorChecked} />
					<p>Illustrator - I want to create illustrative content for written work by writers.</p>
				</label>
			</Step>
			<Step>
				<svelte:fragment slot="header">Social Media</svelte:fragment>
				<label>
					Facebook profile link
					<input class="input" type="text" bind:value={facebook} />
				</label>
				<label>
					Instagram handle
					<input class="input" type="text" bind:value={instagram} />
				</label>
				<label>
					Twitter handle
					<input class="input" type="text" bind:value={twitter} />
				</label>
			</Step>
		</Stepper>
	</div>
</Container>
