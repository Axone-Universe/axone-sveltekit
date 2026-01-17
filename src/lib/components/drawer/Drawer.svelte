<script lang="ts">
	import {
		AppRail,
		AppRailTile,
		getDrawerStore,
		type DrawerSettings
	} from '@skeletonlabs/skeleton';
	import { Drawer } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import {
		pencil,
		user,
		trash,
		users,
		infoCircle,
		home,
		signIn,
		listUl,
		dollar,
		star,
		powerOff,
		navicon
	} from 'svelte-awesome/icons';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';
	import { page } from '$app/stores';
	import { StoreIcon } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import type { UserProperties } from '$lib/properties/user';

	export let data: {
		supabase: SupabaseClient;
		session: Session | null;
		user?: UserProperties | null;
	};
	const drawerStore = getDrawerStore();
	let selectedTile: number = 0;

	const onLogoutButtonClick = async () => {
		await data.supabase.auth.signOut();
		drawerStore.close();
	};

	function navigateTo(path: string) {
		goto(path);
	}

	function openMobileProfileDrawer() {
		const mobileProfileDrawerSettings: DrawerSettings = {
			id: 'mobile-profile',
			bgDrawer: 'bg-surface-100-800-token',
			width: 'w-full',
			padding: 'p-4',
			rounded: 'rounded-t-xl',
			position: 'bottom'
		};
		drawerStore.open(mobileProfileDrawerSettings);
	}

	$: isAmbassador = data.user?.ambassador ?? false;
</script>

{#if $drawerStore.id === 'landing'}
	<Drawer zIndex="z-[1000]">
		<div class="grid grid-cols-3 h-full z-50">
			<AppRail class="col-span-1 w-full border-r border-surface-500/30">
				<div class="h-full flex flex-col justify-between">
					<div>
						<AppRailTile bind:group={selectedTile} name="read" title="Read" value={0}>
							<Icon data={users} scale={1.5} />
						</AppRailTile>
						<AppRailTile bind:group={selectedTile} name="trending" title="Trending" value={1}>
							<Icon data={infoCircle} scale={1.5} />
						</AppRailTile>
						<AppRailTile bind:group={selectedTile} name="collaborate" title="Collaborate" value={2}>
							<Icon data={pencil} scale={1.5} />
						</AppRailTile>
						<AppRailTile bind:group={selectedTile} name="market" title="market" value={3}>
							<StoreIcon class="w-full" size={20} />
						</AppRailTile>
						<hr class="mx-2" />
						<AppRailTile bind:group={selectedTile} name="profile" title="Profile" value={4}>
							<Icon data={user} scale={1.5} />
						</AppRailTile>
					</div>
				</div>
			</AppRail>
			<section hidden={selectedTile != 0} class="m-4 col-span-2">
				<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
					Community
				</div>
				<hr class="my-3 opacity-50" />
				<nav class="list-nav">
					<ul class="list">
						<li>
							<a
								class="w-full"
								href="/community"
								on:click={() => {
									window.open('/community', '_self');
								}}>Connect</a
							>
						</li>
					</ul>
				</nav>
			</section>
			<section hidden={selectedTile != 1} class="m-4 col-span-2">
				<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
					Learn
				</div>
				<hr class="my-3 opacity-50" />
				<nav class="list-nav">
					<ul class="list">
						<li>
							<a
								class="w-full"
								href="/learn"
								on:click={() => {
									window.open('/learn', '_self');
								}}>About</a
							>
						</li>
					</ul>
				</nav>
			</section>
			<section hidden={selectedTile != 2} class="m-4 col-span-2">
				<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
					Write!
				</div>
				<hr class="my-3 opacity-50" />
				<nav class="list-nav">
					<ul class="list">
						<li>
							<a
								class="w-full"
								href="/book/create"
								on:click={() => {
									window.open('/book/create', '_self');
								}}>Start!</a
							>
						</li>
					</ul>
				</nav>
			</section>
			<section hidden={selectedTile != 3} class="m-4 col-span-2">
				<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
					NFTs
				</div>
				<hr class="my-3 opacity-50" />
				<nav class="list-nav">
					<ul class="list">
						<li>
							<a
								class="w-full"
								href="/market"
								on:click={() => {
									window.open('/book/create', '_self');
								}}>Market</a
							>
						</li>
					</ul>
				</nav>
			</section>
			<section hidden={selectedTile != 4} class="m-4 col-span-2">
				<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
					Profile
				</div>
				<hr class="my-3 opacity-50" />
				<nav class="list-nav">
					<ul class="list">
						{#if data.session && data.session.user}
							<li>
								<a
									class="w-full"
									href={`/profile/${data.session.user.id}`}
									on:click={drawerStore.close}
								>
									Profile
								</a>
							</li>
							<li>
								<a class="w-full" href={`/library`} on:click={drawerStore.close}> Library </a>
							</li>
							<li>
								<a class="w-full" href={`/studio`} on:click={drawerStore.close}>Studio</a>
							</li>
							<li>
								<button
									class="w-full"
									on:click={() => {
										onLogoutButtonClick();
										drawerStore.close();
									}}
								>
									Logout
								</button>
							</li>
						{:else}
							<li>
								<a class="w-full" href="/login" on:click={drawerStore.close}>Login</a>
							</li>
						{/if}
					</ul>
				</nav>
			</section>
		</div>
	</Drawer>
{:else if $drawerStore.id === 'library'}
	<Drawer zIndex="z-[1000]">
		<div
			class="h-full sticky flex flex-col justify-between bg-surface-100-800-token pt-4 p-2 gap-2"
		>
			<div class="flex flex-col gap-2">
				{#each $drawerStore.meta.readingLists as list}
					<button
						class="flex justify-between items-center btn btn-sm {$drawerStore.meta.selectedList ===
						list
							? 'variant-filled-primary'
							: 'variant-filled'} py-1"
						on:click={() => {
							$drawerStore.meta.selectedList = list;
							$drawerStore.meta.selectList(list);
							drawerStore.close();
						}}
					>
						<p class="truncate w-full text-left">
							{list}
						</p>
						<div class="flex">
							<button
								class="btn-icon btn-icon-sm"
								on:click={() => {
									drawerStore.close();
									$drawerStore.meta.handleRenameReadingList(list);
								}}
							>
								<Icon data={pencil} scale={1.2} />
							</button>
							<button
								class="btn-icon btn-icon-sm"
								on:click={() => {
									drawerStore.close();
									$drawerStore.meta.handleDeleteReadingList(list);
								}}
							>
								<Icon data={trash} scale={1.2} />
							</button>
						</div>
					</button>
				{/each}
			</div>
			<button
				class="btn variant-filled-secondary"
				on:click={() => {
					drawerStore.close();
					$drawerStore.meta.handleCreateReadingList();
				}}
			>
				+
			</button>
		</div>
	</Drawer>
{:else if $drawerStore.id === 'studio'}
	<Drawer zIndex="z-[1000]">
		<div
			class="h-screen sticky top-16 flex flex-col w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-2 gap-2"
		>
			<a
				class="btn {$page.url.pathname === '/studio/books'
					? 'variant-filled-primary'
					: 'variant-filled'}"
				href="/studio/books"
				on:click={drawerStore.close}
			>
				Books
			</a>
			<a
				class="btn {$page.url.pathname === '/studio/storylines'
					? 'variant-filled-primary'
					: 'variant-filled'}"
				href="/studio/storylines"
				on:click={drawerStore.close}
			>
				Storylines
			</a>
			<a
				class="btn {$page.url.pathname === '/studio/chapters'
					? 'variant-filled-primary'
					: 'variant-filled'}"
				href="/studio/chapters"
				on:click={drawerStore.close}
			>
				Chapters
			</a>
		</div>
	</Drawer>
{:else if $drawerStore.id === 'mobile-profile'}
	<Drawer zIndex="z-[1000]" position="bottom">
		<div class="bg-surface-100-800-token rounded-t-xl p-4 space-y-2">
			<!-- Drawer Handle -->
			<div class="flex justify-center mb-4">
				<div class="w-12 h-1 bg-surface-400-500-token rounded-full" />
			</div>

			{#if data.session && data.session.user}
				<!-- Profile Options -->
				<a
					class="btn space-x-6 hover:variant-soft-primary justify-between w-full"
					href={`/profile/${data.session.user.id}`}
					on:click={drawerStore.close}
				>
					<Icon data={user} />
					<span>Profile</span>
				</a>
				<hr class="!my-2 variant-fill-primary" />
				<a
					class="btn space-x-6 hover:variant-soft-primary justify-between w-full"
					href={`/library`}
					on:click={drawerStore.close}
				>
					<Icon data={listUl} />
					<span>Library</span>
				</a>
				<hr class="!my-2 variant-fill-primary" />
				<a
					class="btn space-x-6 hover:variant-soft-primary justify-between w-full"
					href={`/studio/books?campaigns=true`}
					on:click={drawerStore.close}
				>
					<Icon data={pencil} />
					<span>Studio</span>
				</a>
				<hr class="!my-2 variant-fill-primary" />
				<a
					class="btn space-x-6 hover:variant-soft-primary justify-between w-full"
					href={`/monetize/earnings`}
					on:click={drawerStore.close}
				>
					<Icon data={dollar} />
					<span>Monetize</span>
				</a>
				{#if isAmbassador}
					<hr class="!my-2 variant-fill-primary" />
					<a
						class="btn space-x-6 hover:variant-soft-primary justify-between w-full variant-soft-warning"
						href={`/ambassadors/referrals`}
						on:click={drawerStore.close}
					>
						<Icon data={star} />
						<span>Ambassadors</span>
					</a>
				{/if}
				<hr class="!my-2 variant-fill-primary" />
				<button
					class="btn space-x-6 hover:variant-soft-primary justify-between w-full"
					on:click={onLogoutButtonClick}
				>
					<Icon data={powerOff} />
					<span>Logout</span>
				</button>
			{:else}
				<a class="btn variant-filled-primary w-full" href="/login" on:click={drawerStore.close}>
					Login
				</a>
			{/if}
		</div>
	</Drawer>
{/if}

<!-- Mobile Bottom Navigation Bar -->
<div
	class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-100-800-token border-t border-surface-500/30"
>
	<div
		class="flex justify-around items-center py-2 px-2"
		style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom));"
	>
		<!-- Home Icon -->
		<a
			href={data.session && data.session.user ? '/home' : '/'}
			class="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] text-surface-600-300-token hover:text-primary-500 transition-colors"
			aria-label="Home"
		>
			<Icon data={home} scale={1.5} />
			<span class="text-xs">Home</span>
		</a>

		<!-- Community Icon -->
		<a
			href="/community"
			class="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] text-surface-600-300-token hover:text-primary-500 transition-colors"
			aria-label="Community"
		>
			<Icon data={users} scale={1.5} />
			<span class="text-xs">Community</span>
		</a>

		<!-- Write Icon -->
		<a
			href="/book/create"
			class="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] text-surface-600-300-token hover:text-primary-500 transition-colors"
			aria-label="Write"
			data-sveltekit-preload-data="off"
		>
			<Icon data={pencil} scale={1.5} />
			<span class="text-xs">Write</span>
		</a>

		<!-- Menu Icon -->
		{#if data.session && data.session.user}
			<button
				on:click={openMobileProfileDrawer}
				class="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] text-surface-600-300-token hover:text-primary-500 transition-colors"
				aria-label="Menu"
			>
				<Icon data={navicon} scale={1.5} />
				<span class="text-xs">Menu</span>
			</button>
		{:else}
			<a
				href="/login"
				class="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] text-surface-600-300-token hover:text-primary-500 transition-colors"
				aria-label="Login"
			>
				<Icon data={signIn} scale={1.5} />
				<span class="text-xs">Login</span>
			</a>
		{/if}
	</div>
</div>
