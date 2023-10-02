<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';

	import { drawerStore } from '@skeletonlabs/skeleton';
	import type { DrawerSettings } from '@skeletonlabs/skeleton';

	import { onMount } from 'svelte';

	import Logo from '$lib/assets/logo.svelte';
	import { popup } from '../../util/popup/popup';
	import type { PopupSettings } from '../../util/popup/types';

	import type { SupabaseClient, Session } from '@supabase/supabase-js';

	import Icon from 'svelte-awesome';
	import { caretDown, listUl, navicon, pencil, powerOff, user } from 'svelte-awesome/icons';
	import { collaborateMenuList, creatorsMenuList, readMenuList } from '$lib/util/links';

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
	const profilePopupBox: PopupSettings = popupSettings('profilePopupBox');

	const drawerSettings: DrawerSettings = {
		id: 'landing',
		bgDrawer: 'bg-surface-100-800-token',
		bgBackdrop: 'bg-gradient-to-tr from-indigo-500/50 via-purple-500/50 to-pink-500/50',
		width: 'w-4/6 md:w-1/4',
		padding: 'p-4',
		rounded: 'rounded-xl'
	};

	function openDrawer() {
		drawerStore.open(drawerSettings);
	}

	onMount(() => {
		drawerStore.close();
	});

	/**
	 * Logout event handler
	 */
	const onLogoutButtonClick = async () => {
		await data.supabase.auth.signOut();
	};
</script>

<div class="sticky top-0 z-50 w-full">
	<AppBar
		gridColumns="grid-cols-3"
		slotDefault="flex justify-center"
		slotTrail="place-content-end"
		padding="px-4"
	>
		<svelte:fragment slot="lead">
			<button class="lg:hidden" on:click={openDrawer}>
				<Icon data={navicon} scale={1.5} />
			</button>
			<a
				class="hidden lg:flex items-center text-l"
				href={data.session && data.session.user.id ? '/home' : '/'}
			>
				<Logo />
				<span class="logo-name">AXONE</span>
			</a>
		</svelte:fragment>
		<div class="hidden lg:flex">
			<div>
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
				<button class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none">
					<span class="capitalize">Campaigns</span>
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
				<button class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none">
					<span class="capitalize">Creators</span>
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
					<div class="arrow bg-surface-100-800-token" />
				</div>
			</div>

			<div>
				<button class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none">
					<span class="capitalize">Learn More</span>
				</button>
			</div>
		</div>
		<a
			class="lg:hidden flex items-center text-l"
			href={data.session && data.session.user.id ? '/home' : '/'}
		>
			<Logo />
			<span class="logo-name">AXONE</span>
		</a>
		<svelte:fragment slot="trail">
			<div class="flex gap-2 items-center">
				<div class="lg:flex gap-2 hidden">
					{#if data.session && data.session.user}
						<a
							href="/book/create"
							class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
						>
							<Icon data={pencil} />
							<span class="hidden md:inline-block">Write</span>
						</a>

						<div>
							<button
								class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
								use:popup={profilePopupBox}
							>
								<Icon data={user} />
								<p class="w-[100px] text-ellipsis line-clamp-1 md:inline-block">
									{data.session.user.email}
								</p>
								<Icon data={caretDown} />
							</button>

							<div class="card p-2 shadow-xl" data-popup="profilePopupBox">
								<div class="grid grid-cols-1">
									<a
										class="btn space-x-6 hover:variant-soft-primary"
										href={`/profile/${data.session.user.id}`}
									>
										<Icon data={user} />
										<span>Profile</span>
									</a>
									<a class="btn space-x-6 hover:variant-soft-primary" href={`/library`}>
										<Icon data={listUl} /><span>Library</span>
									</a>
									<hr class="!my-2 variant-fill-primary" />
									<button
										class="btn space-x-6 hover:variant-soft-primary"
										on:click={onLogoutButtonClick}
										><Icon data={powerOff} />
										<span>Logout</span>
									</button>
									<hr class="!my-2 variant-fill-primary" />
									<a
										class="btn space-x-6 hover:variant-soft-primary"
										href={`/user/studio/${data.session.user.id}/books`}
									>
										<Icon data={pencil} />
										<span>Studio</span>
									</a>
								</div>
								<div class="arrow bg-surface-100-800-token" />
							</div>
						</div>
					{:else}
						<a class="btn variant-filled-primary" href="/login"> Login </a>
					{/if}
				</div>
				<LightSwitch />
			</div>
		</svelte:fragment>
	</AppBar>
</div>

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
