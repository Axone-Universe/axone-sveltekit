<script lang="ts">
	import { page } from '$app/stores';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { PageData } from './$types';
	import {
		type TransactionProperties,
		type HydratedTransactionProperties
	} from '$lib/properties/transaction';
	import { getModalStore, type ModalSettings, type ModalComponent } from '@skeletonlabs/skeleton';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import { formattedDate } from '$lib/util/studio/strings';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
	import { arrowDown, arrowLeft, arrowRight, creditCard } from 'svelte-awesome/icons';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { onMount } from 'svelte';
	import { type AccountProperties } from '$lib/properties/account';
	import { currencies } from '$lib/util/constants';
	import { type CurrencyCode } from '$lib/util/types';
	import WithdrawPage from '$lib/components/monetize/WithdrawPage.svelte';

	const colSpan = 10;

	export let data: PageData;
	const { supabase } = data;

	let archiveMode: boolean = false;
	let selectedTransactions: HydratedDocument<TransactionProperties>[] = [];

	const modalStore = getModalStore();

	let placeHolderAccount: HydratedDocument<AccountProperties> | undefined;
	$: account = placeHolderAccount;
	$: currencySymbol = '';

	$: getTransactionsInfinite = trpcWithQuery($page).transactions.get.createInfiniteQuery(
		{
			limit: 10,
			accountId: account?._id ?? ''
		},
		{
			enabled: account ? true : false,
			queryKey: ['monetization', archiveMode],
			getNextPageParam: (lastPage) => lastPage.cursor
		}
	);

	$: transactions = $getTransactionsInfinite?.data
		? ($getTransactionsInfinite.data.pages.flatMap(
				(page) => page.data
		  ) as HydratedDocument<HydratedTransactionProperties>[])
		: [];

	/** life cycles */
	onMount(async () => {
		account = (
			await trpc($page).accounts.getByUserId.query({
				userId: data.session?.user.id!
			})
		).data as HydratedDocument<AccountProperties>;

		console.log('<< account obtained');
		console.log(account);

		if (account) {
			currencySymbol = currencies[account.currency as CurrencyCode].symbol;
			$getTransactionsInfinite.fetchNextPage();
		}
	});

	const withdrawComponent: ModalComponent = {
		ref: WithdrawPage,
		props: {
			account: account
		}
	};

	const withdrawModal: ModalSettings = {
		type: 'component',
		component: withdrawComponent
	};

	function loadMore() {
		$getTransactionsInfinite.fetchNextPage();
	}

	async function refetch() {
		$getTransactionsInfinite.remove();
		await $getTransactionsInfinite.refetch();
		selectedTransactions = [];
	}

	function handleTransactionSelect(
		e: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		},
		Transaction: HydratedDocument<TransactionProperties>
	) {
		if ((e.target as HTMLInputElement).checked) {
			if (!selectedTransactions.includes(Transaction)) {
				selectedTransactions = [...selectedTransactions, Transaction];
			}
		} else {
			selectedTransactions = selectedTransactions.filter((s) => s !== Transaction);
		}
	}

	function withdraw() {
		withdrawComponent.props = {
			account
		};
		modalStore.trigger(withdrawModal);
	}
</script>

<div class="min-h-screen w-full overflow-hidden">
	<div class="w-full min-h-screen flex flex-col gap-2">
		<DrawerButton />

		<div class="table-container min-w-full">
			<table class="table table-hover table-compact">
				<thead>
					<tr>
						<th />
						<th>Note</th>
						<th>Sender</th>
						<th>Status</th>
						<th>Type</th>
						<th>Currency</th>
						<th>Fee</th>
						<th>Value</th>
						<th>Net Value</th>
						<th />
					</tr>
				</thead>
				<tbody>
					<tr>
						<td colspan={colSpan - 2} />
						<td colspan={1}>
							<div class="flex">
								<button class="btn !text-sm font-bold variant-ghost-primary !py-1">
									{currencySymbol}
									{account?.balance?.toFixed(account.currencyScale) ?? 0}
								</button>
							</div>
						</td>
						<td colspan={1}>
							<Tooltip
								on:click={withdraw}
								content="Withdraw"
								placement="top"
								target="create-campaign-btn"
							>
								<button id="create-btn" type="button" class="btn btn-sm variant-filled-primary">
									<span class="px-2"><Icon data={creditCard} /></span>
								</button>
							</Tooltip>
						</td>
					</tr>
					{#if $getTransactionsInfinite.isFetching}
						<tr>
							<td colspan={colSpan}>
								<LoadingSpinner />
							</td>
						</tr>
					{:else if $getTransactionsInfinite.isError}
						<tr>
							<td colspan={colSpan}>
								<InfoHeader
									emoji="🤕"
									heading="Oops!"
									description="Something went wrong while getting your Transactions! Please try again later."
								/>
							</td>
						</tr>
					{:else if transactions.length === 0}
						<tr>
							<td colspan={colSpan}>
								<InfoHeader
									emoji="🤲"
									heading="We're empty handed!"
									description="It looks like you don't have any transactions."
								/>
							</td>
						</tr>
					{:else}
						{#each transactions as transaction}
							<tr>
								<td>
									<input
										class="checkbox"
										type="checkbox"
										on:change={(e) => handleTransactionSelect(e, transaction)}
									/>
								</td>
								<td>{transaction.note}</td>
								<td>{transaction.sender?.firstName}</td>
								<td>
									<span
										class="chip rounded-full {transaction.status === 'success'
											? 'variant-soft-success'
											: transaction.status === 'pending'
											? 'variant-soft-warning'
											: 'variant-soft-error'}">{transaction.status}</span
									>
								</td>
								<td>
									<span
										class="chip rounded-full {transaction.type === 'Payment'
											? 'variant-soft-success'
											: transaction.type === 'NFTokenMint'
											? 'variant-soft-primary'
											: 'variant-soft-error'}">{transaction.type}</span
									>
								</td>
								<td>{account?.currency}</td>
								<td
									>{((transaction.baseValue ?? 0) - (transaction.baseNetValue ?? 0)).toFixed(
										account?.currencyScale
									)}</td
								>
								<td>{transaction.baseValue?.toFixed(account?.currencyScale)}</td>
								<td
									class="font-bold {transaction.type === 'Payment'
										? 'text-success-600-300-token'
										: 'text-error-600-300-token'}"
								>
									<Icon
										class="mr-2"
										data={transaction.type === 'Payment' ? arrowRight : arrowLeft}
										scale={1}
									/>
									{currencySymbol}
									{transaction.baseNetValue?.toFixed(account?.currencyScale)}
								</td>
								<td />
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		{#if $getTransactionsInfinite.hasNextPage}
			<div class="flex justify-center my-2">
				<Tooltip on:click={loadMore} content="Load more" placement="top" target="reading-list">
					<button class="btn-icon variant-filled">
						<Icon data={arrowDown} />
					</button>
				</Tooltip>
			</div>
		{/if}
	</div>
</div>
