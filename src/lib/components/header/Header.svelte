<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { AppRail, AppRailTile } from '@skeletonlabs/skeleton';
	import { Drawer, drawerStore } from '@skeletonlabs/skeleton';
	import type { DrawerSettings } from '@skeletonlabs/skeleton';

	import { writable, type Writable } from 'svelte/store';

	import Logo from '$lib/assets/logo.svelte';
	import { popup } from '../../util/popup/popup';
	import type { PopupSettings } from '../../util/popup/types';

	import type { SupabaseClient, Session } from '@supabase/supabase-js';

	import Icon from 'svelte-awesome';
	import { caretDown, navicon, leanpub, heartbeat, handshakeO, pencil } from 'svelte-awesome/icons';

	export let data: { supabase: SupabaseClient; session: Session | null };

	/**
	 * parameters and methods for the nav header
	 * @param target
	 */
	const popupSettings = (target: string) => {
		let settings: PopupSettings = {
			event: 'hover-popup',
			target: target,
			placement: 'bottom'
		};
		return settings;
	};

	const readPopupBox: PopupSettings = popupSettings('readPopupBox');
	const collaboratePopupBox: PopupSettings = popupSettings('collaboratePopupBox');
	const creatorsPopupBox: PopupSettings = popupSettings('creatorsPopupBox');

	const readMenuList = [
		{ url: '/genres/sci-fi', label: 'Sci-Fi' },
		{ url: '/genres/fantasy', label: 'Fantasy' },
		{ url: '/genres/mystery', label: 'Mystery' },
		{ url: '/genres/action', label: 'Action' },
		{ url: '/genres/horror', label: 'Horror' },
		{ url: '/genres/humor', label: 'Humor' },
		{ url: '/genres/erotica', label: 'Erotica' },
		{ url: '/genres/thriller', label: 'Thriller' },
		{ url: '/genres/romance', label: 'Romance' },
		{ url: '/genres/children', label: 'Children' }
	];

	const collaborateMenuList = [
		{ url: '/open-calls', label: 'Open Calls' },
		{ url: '/campaigns', label: 'Campaigns' }
	];

	const creatorsMenuList = [
		{ url: '/authors', label: 'Sci-Fi' },
		{ url: '/illustrators', label: 'Illustrators' },
		{ url: '/editors', label: 'Editors' }
	];

	/**
	 * App Rail settings
	 */
	// for storing selected app rail item on smaller screens
	const storeValue: Writable<number> = writable(0);
	let selectedTile: number;

	storeValue.subscribe((value) => {
		selectedTile = value;
	});

	const drawerSettings: DrawerSettings = {
		id: 'example-3',
		bgDrawer: 'bg-surface-100-800-token',
		bgBackdrop: 'bg-gradient-to-tr from-indigo-500/50 via-purple-500/50 to-pink-500/50',
		width: 'w-[280px] md:w-[480px]',
		padding: 'p-4',
		rounded: 'rounded-xl'
	};

	function openDrawer() {
		drawerStore.open(drawerSettings);
	}

	/**
	 * Logout event handler
	 */
	const onLogoutButtonClick = async () => {
		await data.supabase.auth.signOut();
	};
</script>

<AppBar gridColumns="grid-cols-3" slotDefault="flex justify-center" slotTrail="place-content-end">
	<svelte:fragment slot="lead">
		<button class="lg:hidden" on:click={openDrawer}>
			<Icon data={navicon} scale={1.5} />
		</button>
		{#if data.session && data.session.user}
			<a class="hidden md:flex items-center text-l" href="/home">
				<Logo />
				<span class="logo-name">AXONE</span>
			</a>
		{:else}
			<a class="hidden md:flex items-center text-l" href="/">
				<Logo />
				<span class="logo-name">AXONE</span>
			</a>
		{/if}
	</svelte:fragment>
	<AppBar padding="p-2" class="hidden lg:inline-block">
		<svelte:fragment slot="lead">
			<div>
				<button
					class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
					use:popup={readPopupBox}
				>
					<span class="capitalize">Read</span>
					<Icon data={caretDown} />
				</button>

				<div class="card p-4 w-fit" data-popup="readPopupBox">
					<nav class="list-nav">
						<ul class="grid grid-cols-2 gap-2 list">
							{#each readMenuList as menuItem}
								<li>
									<a href={menuItem.url} class="w-full">{menuItem.label}</a>
								</li>
							{/each}
						</ul>
					</nav>
					<div class="arrow bg-surface-100-800-token" />
				</div>
			</div>

			<div>
				<button class="btn justify-between hover:variant-soft-primary">
					<span class="capitalize">Trending</span>
				</button>
			</div>

			<div>
				<button
					class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
					use:popup={collaboratePopupBox}
				>
					<span class="capitalize">Collaborate</span>
					<Icon data={caretDown} />
				</button>

				<div id="card" class="card p-4 w-fit shadow-xl" data-popup="collaboratePopupBox">
					<div class="grid grid-cols-1">
						<nav class="list-nav">
							<ul class="grid grid-cols-1 gap-2 list">
								{#each collaborateMenuList as menuItem}
									<li>
										<a href={menuItem.url} class="w-full">{menuItem.label}</a>
									</li>
								{/each}
							</ul>
						</nav>
					</div>
					<div class="arrow bg-surface-100-800-token" />
				</div>
			</div>

			<div>
				<button
					class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
					use:popup={creatorsPopupBox}
				>
					<span class="capitalize">Creators</span>
					<Icon data={caretDown} />
				</button>

				<div class="card p-4 w-fit shadow-xl" data-popup="creatorsPopupBox">
					<div class="grid grid-cols-1">
						<nav class="list-nav">
							<ul class="grid grid-cols-1 gap-2 list">
								{#each creatorsMenuList as menuItem}
									<li>
										<a href={menuItem.url} class="w-full">{menuItem.label}</a>
									</li>
								{/each}
							</ul>
						</nav>
					</div>
				</div>
				<div class="arrow bg-surface-100-800-token" />
			</div>
		</svelte:fragment>
	</AppBar>
	<svelte:fragment slot="trail">
		<div class="flex gap-2 items-center">
			{#if data.session && data.session.user}
				<button class="btn variant-filled-primary" on:click={onLogoutButtonClick}>Logout</button>
				<a class="btn variant-filled-primary" href={`/profile/${data.session.user.id}`}>Profile</a>
			{:else}
				<div class="flex gap-2">
					<a class="btn variant-filled-primary" href="/login"> Login </a>
					<a class="hidden lg:inline-block btn variant-filled-primary" href="sign-up"> Sign up </a>
				</div>
			{/if}
			<LightSwitch />
		</div>
	</svelte:fragment>
</AppBar>

<Drawer>
	<div class="grid grid-cols-3 h-full">
		<AppRail class="col-span-1 w-full border-r border-surface-500/30" selected={storeValue}>
			<AppRailTile label="Read" value={0}><Icon data={leanpub} scale={1.5} /></AppRailTile>
			<AppRailTile label="Trending" value={1}><Icon data={heartbeat} scale={1.5} /></AppRailTile>
			<AppRailTile label="Collaborate" value={2}><Icon data={handshakeO} scale={1.5} /></AppRailTile
			>
			<AppRailTile label="Creators" value={3}><Icon data={pencil} scale={1.5} /></AppRailTile>
		</AppRail>
		<section hidden={selectedTile != 0} class="col-span-2 m-4">
			<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
				Genres
			</div>
			<hr class="!my-6 opacity-50" />
			<nav class="list-nav">
				<ul class="list">
					{#each readMenuList as menuItem}
						<li>
							<a href={menuItem.url} class="w-full">{menuItem.label}</a>
						</li>
					{/each}
				</ul>
			</nav>
		</section>
		<section hidden={selectedTile != 2} class="m-4 col-span-2">
			<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
				Collaborate
			</div>
			<hr class="!my-6 opacity-50" />
			<nav class="list-nav">
				<ul class="list">
					{#each collaborateMenuList as menuItem}
						<li>
							<a href={menuItem.url} class="w-full">{menuItem.label}</a>
						</li>
					{/each}
				</ul>
			</nav>
		</section>
		<section hidden={selectedTile != 3} class="m-4 col-span-2">
			<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
				Creators
			</div>
			<hr class="!my-6 opacity-50" />
			<nav class="list-nav">
				<ul class="list">
					{#each creatorsMenuList as menuItem}
						<li>
							<a href={menuItem.url} class="w-full">{menuItem.label}</a>
						</li>
					{/each}
				</ul>
			</nav>
		</section>
	</div>
</Drawer>

<style>
	@font-face {
		font-family: colortube;
		src: url('/fonts/color_tube.otf') format('opentype');
	}

	.logo-name {
		font-family: colortube;
		margin-bottom: -10px;
	}
</style>