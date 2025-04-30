<script lang="ts">
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { pencil, user, trash, users, infoCircle } from 'svelte-awesome/icons';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';
	import { page } from '$app/stores';

	export let data: { supabase: SupabaseClient; session: Session | null };
	const drawerStore = getDrawerStore();
	let selectedTile: number = 0;

	const onLogoutButtonClick = async () => {
		await data.supabase.auth.signOut();
	};
</script>

{#if $drawerStore.id === 'landing'}
	<Drawer zIndex="z-1000">
		<div class="grid grid-cols-3 h-full z-50">
			<Navigation class="col-span-1 w-full border-r border-surface-500/30">
				<div class="h-full flex flex-col justify-between">
					<div>
						<Navigation.Tile bind:group="{selectedTile}" name="read" title="Read" value="{0}">
							<Icon data="{users}" scale="{1.5}" />
						</Navigation.Tile>
						<Navigation.Tile
							bind:group="{selectedTile}"
							name="trending"
							title="Trending"
							value="{1}"
						>
							<Icon data="{infoCircle}" scale="{1.5}" />
						</Navigation.Tile>
						<Navigation.Tile
							bind:group="{selectedTile}"
							name="collaborate"
							title="Collaborate"
							value="{2}"
						>
							<Icon data="{pencil}" scale="{1.5}" />
						</Navigation.Tile>
						<hr class="mx-2" />
						<Navigation.Tile bind:group="{selectedTile}" name="profile" title="Profile" value="{4}">
							<Icon data="{user}" scale="{1.5}" />
						</Navigation.Tile>
					</div>
				</div>
			</Navigation>
			<section hidden="{selectedTile != 0}" class="m-4 col-span-2">
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
								onclick="{() => {
									window.open('/community', '_self');
								}}">Connect</a
							>
						</li>
					</ul>
				</nav>
			</section>
			<section hidden="{selectedTile != 1}" class="m-4 col-span-2">
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
								onclick="{() => {
									window.open('/learn', '_self');
								}}">About</a
							>
						</li>
					</ul>
				</nav>
			</section>
			<section hidden="{selectedTile != 2}" class="m-4 col-span-2">
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
								onclick="{() => {
									window.open('/book/create', '_self');
								}}">Start!</a
							>
						</li>
					</ul>
				</nav>
			</section>
			<section hidden="{selectedTile != 4}" class="m-4 col-span-2">
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
									href="{`/profile/${data.session.user.id}`}"
									onclick="{drawerStore.close}"
								>
									Profile
								</a>
							</li>
							<li>
								<a class="w-full" href="{`/library`}" onclick="{drawerStore.close}"> Library </a>
							</li>
							<li>
								<a class="w-full" href="{`/studio`}" onclick="{drawerStore.close}">Studio</a>
							</li>
							<li>
								<button
									class="w-full"
									onclick="{() => {
										onLogoutButtonClick();
										drawerStore.close();
									}}"
								>
									Logout
								</button>
							</li>
						{:else}
							<li>
								<a class="w-full" href="/login" onclick="{drawerStore.close}">Login</a>
							</li>
						{/if}
					</ul>
				</nav>
			</section>
		</div>
	</Drawer>
{:else if $drawerStore.id === 'library'}
	<Drawer zIndex="z-1000">
		<div class="h-full sticky flex flex-col justify-between bg-surface-100-900 pt-4 p-2 gap-2">
			<div class="flex flex-col gap-2">
				{#each $drawerStore.meta.readingLists as list}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						class="flex justify-between items-center btn btn-sm {$drawerStore.meta.selectedList ===
						list
							? 'preset-filled-primary-500'
							: 'preset-filled'} py-1"
						onclick="{() => {
							$drawerStore.meta.selectedList = list;
							$drawerStore.meta.selectList(list);
							drawerStore.close();
						}}"
					>
						<p class="truncate w-full text-left">
							{list}
						</p>
						<div class="flex">
							<button
								class="btn-icon btn-icon-sm"
								onclick="{() => {
									drawerStore.close();
									$drawerStore.meta.handleRenameReadingList(list);
								}}"
							>
								<Icon data="{pencil}" scale="{1.2}" />
							</button>
							<button
								class="btn-icon btn-icon-sm"
								onclick="{() => {
									drawerStore.close();
									$drawerStore.meta.handleDeleteReadingList(list);
								}}"
							>
								<Icon data="{trash}" scale="{1.2}" />
							</button>
						</div>
					</div>
				{/each}
			</div>
			<button
				class="btn preset-filled-secondary-500"
				onclick="{() => {
					drawerStore.close();
					$drawerStore.meta.handleCreateReadingList();
				}}"
			>
				+
			</button>
		</div>
	</Drawer>
{:else if $drawerStore.id === 'studio'}
	<Drawer zIndex="z-1000">
		<div
			class="h-screen sticky top-16 flex flex-col w-64 min-w-[16rem] bg-surface-100-900 pt-4 pb-24 p-2 gap-2"
		>
			<a
				class="btn {$page.url.pathname === '/studio/books'
					? 'preset-filled-primary-500'
					: 'preset-filled'}"
				href="/studio/books"
				onclick="{drawerStore.close}"
			>
				Books
			</a>
			<a
				class="btn {$page.url.pathname === '/studio/storylines'
					? 'preset-filled-primary-500'
					: 'preset-filled'}"
				href="/studio/storylines"
				onclick="{drawerStore.close}"
			>
				Storylines
			</a>
			<a
				class="btn {$page.url.pathname === '/studio/chapters'
					? 'preset-filled-primary-500'
					: 'preset-filled'}"
				href="/studio/chapters"
				onclick="{drawerStore.close}"
			>
				Chapters
			</a>
		</div>
	</Drawer>
{/if}
