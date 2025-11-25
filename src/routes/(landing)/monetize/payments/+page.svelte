<script lang="ts">
	import { page } from '$app/stores';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { PageData } from './$types';
	import {
		type TransactionProperties,
		type HydratedTransactionProperties
	} from '$lib/properties/transaction';
	import {
		getToastStore,
		getModalStore,
		type ModalSettings,
		type ToastSettings
	} from '@skeletonlabs/skeleton';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import { getArchiveModal, getUnarchiveModal } from '$lib/util/studio/modals';
	import RowActions from '$lib/components/studio/RowActions.svelte';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
	import { arrowDown, cartArrowDown, trash, check } from 'svelte-awesome/icons';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { type AccountProperties } from '$lib/properties/account';
	import { currencies } from '$lib/util/constants';

	const archiveModal = getArchiveModal();
	const unArchiveModal = getUnarchiveModal();
	const colSpan = 10;

	export let data: PageData;
	const { supabase } = data;

	let archiveMode: boolean = false;
	let selectedTransactions: HydratedDocument<TransactionProperties>[] = [];

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	$: getTransactionsInfinite = trpcWithQuery($page).transactions.get.createInfiniteQuery(
		{
			limit: 10,
			senderId: data.session?.user.id!
		},
		{
			queryKey: ['payments', archiveMode],
			getNextPageParam: (lastPage) => lastPage.cursor
		}
	);

	$: transactions = $getTransactionsInfinite?.data
		? ($getTransactionsInfinite.data.pages.flatMap(
				(page) => page.data
		  ) as HydratedDocument<HydratedTransactionProperties>[])
		: [];

	let account: HydratedDocument<AccountProperties> | undefined;
	$: account = undefined;

	function loadMore() {
		$getTransactionsInfinite.fetchNextPage();
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

	function cancelTransaction(transactionId: string) {
		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: 'Cancel Transaction',
			body: 'Are you sure you want to cancel this transaction?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					trpc($page)
						.transactions.cancel.mutate({
							id: transactionId
						})
						.then(async (response) => {
							if (response.success) {
								transactions = transactions.filter((txn) => txn._id !== transactionId);
							}
							const deleteFail: ToastSettings = {
								message: response.message,
								background: response.success ? 'variant-filled-success' : 'variant-filled-error'
							};
							toastStore.trigger(deleteFail);
						})
						.catch((error: any) => {
							console.log(error);
						});
				}
			}
		};
		modalStore.trigger(modal);
	}

	function completeTransaction(transactionId: string) {
		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: 'Complete Transaction',
			body: 'Are you sure you want to mark this transaction as complete?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					trpc($page)
						.transactions.complete.mutate({
							id: transactionId
						})
						.then(async (response) => {
							if (response.success) {
								// Refetch transactions to update the list
								$getTransactionsInfinite.refetch();
							}
							const completionToast: ToastSettings = {
								message: response.message,
								background: response.success ? 'variant-filled-success' : 'variant-filled-error'
							};
							toastStore.trigger(completionToast);
						})
						.catch((error: any) => {
							console.log(error);
							const errorToast: ToastSettings = {
								message: 'Failed to complete transaction',
								background: 'variant-filled-error'
							};
							toastStore.trigger(errorToast);
						});
				}
			}
		};
		modalStore.trigger(modal);
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
						<th>Receiver</th>
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
								<td>{transaction.receiver?.firstName}</td>
								<td
									><span
										class="chip rounded-full {transaction.status === 'success'
											? 'variant-soft-success'
											: transaction.status === 'pending'
											? 'variant-soft-warning'
											: 'variant-soft-error'}">{transaction.status}</span
									></td
								>
								<td>
									<span
										class="chip rounded-full {transaction.type === 'Withdrawal'
											? 'variant-soft-error'
											: transaction.type === 'NFTokenMint'
											? 'variant-soft-primary'
											: 'variant-soft-success'}">{transaction.type}</span
									>
								</td>
								<td>{transaction.currency}</td>
								<td
									>{((transaction.baseValue ?? 0) - (transaction.baseNetValue ?? 0)).toFixed(
										currencies[transaction.currency ?? 'XRP'].scale
									)}</td
								>
								<td>{transaction.value}</td>
								<td>{transaction.netValue}</td>
								<td>
									{#if transaction.status === 'pending'}
										<RowActions
											document={transaction}
											rowActions={transaction.currency === 'XRP'
												? [
														{
															label: 'Checkout',
															icon: cartArrowDown,
															callback: () => {
																window.open(
																	`/payment?payloadId=${transaction.payload?.uuid}`,
																	'_blank'
																);
															}
														},
														{
															label: 'Cancel',
															icon: trash,
															callback: () => {
																cancelTransaction(transaction._id);
															}
														}
												  ]
												: [
														{
															label: 'Complete',
															icon: check,
															callback: () => {
																completeTransaction(transaction._id);
															}
														},
														{
															label: 'Cancel',
															icon: trash,
															callback: () => {
																cancelTransaction(transaction._id);
															}
														}
												  ]}
										/>
									{/if}
								</td>
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
