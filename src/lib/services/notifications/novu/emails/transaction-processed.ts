import { render } from 'svelte-email';
import TransactionProcessed from '$lib/components/notifications/email-templates/transaction-processed.svelte';
import { Transaction } from '$lib/models/transaction';
import { Chapter } from '$lib/models/chapter';
import type { HydratedDocument } from 'mongoose';
import type { TransactionProperties } from '$lib/properties/transaction';
import type { ChapterProperties } from '$lib/properties/chapter';
import type { BookProperties } from '$lib/properties/book';
import { PUBLIC_DOMAIN_NAME } from '$env/static/public';
import { getAdminUser } from '../admin-user';

export interface TransactionProcessedEmailProps {
	transactionId: string;
}

export type TransactionNotificationType = 'withdrawal' | 'failure' | 'success';

export async function renderTransactionProcessedEmail({
	transactionId
}: TransactionProcessedEmailProps) {
	// Get admin user for aggregate query options (ensures correct permissions)
	const adminUser = await getAdminUser();

	// Fetch the transaction from the database (sender and receiver are automatically populated)
	const transactions = await Transaction.aggregate(
		[
			{
				$match: { _id: transactionId }
			}
		],
		{
			user: adminUser
		}
	).exec();

	if (!transactions || transactions.length === 0) {
		throw new Error(`Transaction with ID ${transactionId} not found`);
	}

	const transaction = transactions[0] as HydratedDocument<TransactionProperties>;

	// Determine notification type based on transaction type and status
	let notificationType: TransactionNotificationType;
	if (transaction.type === 'Withdrawal') {
		notificationType = 'withdrawal';
	} else if (transaction.status === 'failed') {
		notificationType = 'failure';
	} else if (transaction.status === 'success') {
		notificationType = 'success';
	} else {
		// Default to success for pending transactions
		notificationType = 'success';
	}

	// Format the transaction amount
	const currency = transaction.currency || 'XRP';
	const netValue = transaction.netValue || 0;
	const formattedAmount = netValue.toFixed(currency === 'XRP' ? 6 : 2);
	const amountDisplay = `${formattedAmount} ${currency}`;

	// Format the transaction date
	const transactionDate = transaction.processedAt || transaction.createdAt || new Date();
	const formattedDate = transactionDate.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	// Get sender/receiver names
	const senderName = transaction.sender
		? `${(transaction.sender as any).firstName || ''} ${
				(transaction.sender as any).lastName || ''
		  }`.trim() || 'Anonymous'
		: 'Anonymous';

	const receiverName = transaction.receiver
		? `${(transaction.receiver as any).firstName || ''} ${
				(transaction.receiver as any).lastName || ''
		  }`.trim() || 'Anonymous'
		: 'Anonymous';

	const origin = PUBLIC_DOMAIN_NAME;
	let chapterTitle: string | undefined;
	let bookTitle: string | undefined;
	let chapterUrl: string | undefined;

	// If it's a chapter payment, fetch chapter and book details
	if (transaction.documentType === 'Chapter' && transaction.documentId) {
		try {
			const chapters = await Chapter.aggregate(
				[
					{
						$match: { _id: transaction.documentId }
					},
					{
						$lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'book' }
					},
					{
						$unwind: {
							path: '$book',
							preserveNullAndEmptyArrays: true
						}
					}
				],
				{
					user: adminUser
				}
			).exec();

			if (chapters && chapters.length > 0) {
				const chapter = chapters[0] as HydratedDocument<ChapterProperties> & {
					book: HydratedDocument<BookProperties>;
				};

				if (chapter.book) {
					const book = chapter.book as HydratedDocument<BookProperties>;
					chapterTitle = chapter.title || 'Untitled Chapter';
					bookTitle = book.title;
					chapterUrl = `${origin}/book/${book._id}?chapter=${chapter._id}`;
				}
			}
		} catch (error) {
			// If chapter lookup fails, continue without chapter details
			console.error('Error fetching chapter details:', error);
		}
	}

	return render({
		template: TransactionProcessed,
		props: {
			notificationType,
			transactionType: transaction.type || 'Payment',
			transactionStatus: transaction.status || 'pending',
			amount: amountDisplay,
			currency,
			senderName,
			receiverName,
			transactionDate: formattedDate,
			transactionHash: transaction.hash,
			chapterTitle,
			bookTitle,
			chapterUrl,
			note: transaction.note,
			origin
		} as any
	});
}

