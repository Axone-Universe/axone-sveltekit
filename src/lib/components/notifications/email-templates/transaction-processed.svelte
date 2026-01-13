<script lang="ts">
	import {
		Body,
		Container,
		Head,
		Html,
		Preview,
		Section,
		Text,
		Heading,
		Link,
		Hr,
		Img
	} from 'svelte-email';

	export let notificationType: 'withdrawal' | 'failure' | 'success';
	export let transactionType: string;
	export let transactionStatus: string;
	export let amount: string;
	export let currency: string;
	export let senderName: string;
	export let receiverName: string;
	export let transactionDate: string;
	export let transactionHash: string | undefined;
	export let chapterTitle: string | undefined;
	export let bookTitle: string | undefined;
	export let chapterUrl: string | undefined;
	export let note: string | undefined;
	export let origin: string;

	const fontFamily = '"Google Sans", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif';

	const main = {
		backgroundColor: '#f5f5f5',
		fontFamily
	};

	const wrapper = {
		backgroundColor: '#f5f5f5',
		padding: '16px'
	};

	const container = {
		maxWidth: '600px',
		margin: '0 auto',
		backgroundColor: '#ffffff',
		borderRadius: '8px',
		overflow: 'hidden',
		boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
	};

	const header = {
		backgroundColor: '#E8E6FF', // Toned down version of primary color #4F46E5
		padding: '32px',
		textAlign: 'center' as const
	};

	const logo = {
		margin: '0 auto 16px',
		padding: '16px',
		display: 'block'
	};

	const headerTitle = {
		fontFamily,
		fontSize: '30px',
		fontWeight: 'bold',
		color: '#4F46E5', // Primary theme color for contrast on light background
		margin: '0 0 8px 0',
		lineHeight: '1.2'
	};

	const headerDivider = {
		width: '96px',
		height: '4px',
		backgroundColor: 'rgba(79, 70, 229, 0.3)', // Subtle version of primary color
		margin: '0 auto',
		borderRadius: '9999px'
	};

	const content = {
		padding: '32px'
	};

	const titleSection = {
		textAlign: 'center' as const,
		marginBottom: '32px'
	};

	// Badge styles based on notification type
	const badgeSuccess = {
		display: 'inline-block',
		padding: '8px 16px',
		borderRadius: '9999px',
		fontSize: '14px',
		fontWeight: '600',
		backgroundColor: '#dbf5ec',
		color: '#0b8c61',
		marginBottom: '12px'
	};

	const badgeFailure = {
		display: 'inline-block',
		padding: '8px 16px',
		borderRadius: '9999px',
		fontSize: '14px',
		fontWeight: '600',
		backgroundColor: '#fee2e2',
		color: '#dc2626',
		marginBottom: '12px'
	};

	const badgeWithdrawal = {
		display: 'inline-block',
		padding: '8px 16px',
		borderRadius: '9999px',
		fontSize: '14px',
		fontWeight: '600',
		backgroundColor: '#fef3c7',
		color: '#d97706',
		marginBottom: '12px'
	};

	const chapterTitleStyle = {
		fontFamily,
		fontSize: '30px',
		fontWeight: 'bold',
		color: '#111827',
		margin: '0 0 8px 0',
		lineHeight: '1.3'
	};

	const bookTitleStyle = {
		fontFamily,
		fontSize: '18px',
		color: '#6b7280',
		margin: '0',
		lineHeight: '1.4'
	};

	const descriptionText = {
		fontFamily,
		fontSize: '18px',
		color: '#374151',
		lineHeight: '1.75',
		margin: '0 0 32px 0',
		textAlign: 'center' as const
	};

	// Amount section styles based on notification type
	const amountSectionSuccess = {
		backgroundColor: '#f0fdf4',
		border: '2px solid #0FBA81',
		borderRadius: '12px',
		padding: '32px',
		textAlign: 'center' as const,
		marginBottom: '32px'
	};

	const amountSectionFailure = {
		backgroundColor: '#fef2f2',
		border: '2px solid #dc2626',
		borderRadius: '12px',
		padding: '32px',
		textAlign: 'center' as const,
		marginBottom: '32px'
	};

	const amountSectionWithdrawal = {
		backgroundColor: '#fffbeb',
		border: '2px solid #d97706',
		borderRadius: '12px',
		padding: '32px',
		textAlign: 'center' as const,
		marginBottom: '32px'
	};

	const amountLabel = {
		fontFamily,
		fontSize: '14px',
		color: '#6b7280',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.5px',
		margin: '0 0 8px 0',
		fontWeight: '600'
	};

	const amountValueSuccess = {
		fontFamily,
		fontSize: '48px',
		fontWeight: 'bold',
		color: '#0FBA81',
		margin: '0',
		lineHeight: '1.2'
	};

	const amountValueFailure = {
		fontFamily,
		fontSize: '48px',
		fontWeight: 'bold',
		color: '#dc2626',
		margin: '0',
		lineHeight: '1.2'
	};

	const amountValueWithdrawal = {
		fontFamily,
		fontSize: '48px',
		fontWeight: 'bold',
		color: '#d97706',
		margin: '0',
		lineHeight: '1.2'
	};

	const transactionDetailsSection = {
		backgroundColor: '#f8f9fa',
		border: '1px solid #e5e7eb',
		borderRadius: '12px',
		padding: '24px',
		marginBottom: '32px'
	};

	const detailRow = {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '12px 0',
		borderBottom: '1px solid #e5e7eb'
	};

	const detailRowLast = {
		...detailRow,
		borderBottom: 'none'
	};

	const detailLabel = {
		fontFamily,
		fontSize: '14px',
		color: '#6b7280',
		margin: '0',
		fontWeight: '500'
	};

	const detailValue = {
		fontFamily,
		fontSize: '16px',
		color: '#111827',
		margin: '0',
		fontWeight: '600'
	};

	const transactionHashStyle = {
		fontFamily,
		fontSize: '12px',
		color: '#6b7280',
		wordBreak: 'break-all' as const
	};

	const ctaSection = {
		textAlign: 'center' as const,
		marginBottom: '32px'
	};

	const ctaButton = {
		display: 'inline-block',
		padding: '16px 40px',
		fontSize: '18px',
		fontWeight: '600',
		borderRadius: '9999px',
		background: 'linear-gradient(135deg, #0FBA81 0%, #4F46E5 100%)',
		color: '#ffffff',
		textDecoration: 'none',
		boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
	};

	const ctaButtonFailure = {
		display: 'inline-block',
		padding: '16px 40px',
		fontSize: '18px',
		fontWeight: '600',
		borderRadius: '9999px',
		background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
		color: '#ffffff',
		textDecoration: 'none',
		boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
	};

	const ctaSubtext = {
		fontFamily,
		fontSize: '14px',
		color: '#6b7280',
		marginTop: '16px',
		margin: '16px 0 0 0'
	};

	const divider = {
		border: 'none',
		borderTop: '1px solid #b2b9bb',
		margin: '32px 0',
		opacity: 0.5
	};

	const quoteSection = {
		textAlign: 'center' as const
	};

	const quoteContainer = {
		maxWidth: '672px',
		margin: '0 auto'
	};

	const quoteWrapper = {
		position: 'relative' as const
	};

	const quoteText = {
		fontFamily: 'Georgia, serif',
		fontSize: '20px',
		fontStyle: 'italic',
		color: '#374151',
		padding: '16px 32px',
		margin: '0'
	};

	const quoteAuthor = {
		fontFamily,
		color: '#4b5563',
		fontWeight: '600',
		marginTop: '24px',
		margin: '24px 0 0 0'
	};

	const footer = {
		backgroundColor: '#e2e5e5',
		borderTop: '1px solid #b2b9bb',
		padding: '24px',
		textAlign: 'center' as const,
		borderRadius: '0 0 8px 8px'
	};

	const footerContact = {
		fontFamily,
		fontSize: '14px',
		color: '#4b5563',
		margin: '0 0 8px 0'
	};

	const footerLink = {
		color: '#0FBA81',
		textDecoration: 'none'
	};

	const footerCopyright = {
		fontFamily,
		fontSize: '12px',
		color: '#6b7280',
		margin: '0'
	};

	// Computed values based on notification type
	$: badgeStyle =
		notificationType === 'success'
			? badgeSuccess
			: notificationType === 'failure'
			? badgeFailure
			: badgeWithdrawal;

	$: amountSectionStyle =
		notificationType === 'success'
			? amountSectionSuccess
			: notificationType === 'failure'
			? amountSectionFailure
			: amountSectionWithdrawal;

	$: amountValueStyle =
		notificationType === 'success'
			? amountValueSuccess
			: notificationType === 'failure'
			? amountValueFailure
			: amountValueWithdrawal;

	$: headerTitleText =
		notificationType === 'success'
			? 'Payment Received'
			: notificationType === 'failure'
			? 'Transaction Failed'
			: 'Withdrawal Request';

	$: badgeText =
		notificationType === 'success'
			? '💰 Payment Received'
			: notificationType === 'failure'
			? '❌ Transaction Failed'
			: '💸 Withdrawal Request';

	$: amountLabelText =
		notificationType === 'success'
			? 'Amount Received'
			: notificationType === 'failure'
			? 'Failed Amount'
			: 'Withdrawal Amount';

	$: descriptionMessage =
		notificationType === 'success'
			? 'Your payment has been successfully processed and credited to your account.'
			: notificationType === 'failure'
			? 'We encountered an issue processing your transaction. Please try again or contact support if the problem persists.'
			: 'Your withdrawal request has been received and is being processed. You will be notified once it is completed.';

	$: ctaButtonText =
		notificationType === 'success'
			? chapterUrl
				? 'View Chapter'
				: 'View Transaction'
			: notificationType === 'failure'
			? 'Try Again'
			: 'View Status';

	$: ctaButtonStyle = notificationType === 'failure' ? ctaButtonFailure : ctaButton;

	$: ctaSubtextMessage =
		notificationType === 'success'
			? 'Thank you for your contribution to the community'
			: notificationType === 'failure'
			? 'If you continue to experience issues, please contact our support team'
			: 'We will notify you once your withdrawal is processed';
</script>

<Html>
	<Head />
	<Preview preview="{headerTitleText}: {amount}">
		{headerTitleText}: {amount}
	</Preview>
	<Body style={main}>
		<Section style={wrapper}>
			<Container style={container}>
				<!-- Header with Logo -->
				<Section style={header}>
					<Img src="{origin}/logo_banner.png" alt="Logo" width="400" height="auto" style={logo} />
					<Heading style={headerTitle}>{headerTitleText}</Heading>
					<Section style={headerDivider} />
				</Section>

				<!-- Main Content -->
				<Section style={content}>
					<!-- Title Section -->
					<Section style={titleSection}>
						<Text style={badgeStyle}>{badgeText}</Text>
						{#if chapterTitle && bookTitle}
							<Heading style={chapterTitleStyle}>{chapterTitle}</Heading>
							<Text style={bookTitleStyle}>from {bookTitle}</Text>
						{/if}
					</Section>

					<!-- Description -->
					<Section>
						<Text style={descriptionText}>{descriptionMessage}</Text>
					</Section>

					<!-- Amount Section -->
					<Section style={amountSectionStyle}>
						<Text style={amountLabel}>{amountLabelText}</Text>
						<Text style={amountValueStyle}>{amount}</Text>
					</Section>

					<!-- Transaction Details -->
					<Section style={transactionDetailsSection}>
						<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
							{#if notificationType === 'withdrawal'}
								<tr>
									<td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
										<table
											role="presentation"
											cellspacing="0"
											cellpadding="0"
											border="0"
											width="100%"
										>
											<tr>
												<td style="padding: 0;">
													<Text style={detailLabel}>Recipient</Text>
												</td>
												<td style="padding: 0; text-align: right;">
													<Text style={detailValue}>{receiverName}</Text>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							{:else}
								<tr>
									<td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
										<table
											role="presentation"
											cellspacing="0"
											cellpadding="0"
											border="0"
											width="100%"
										>
											<tr>
												<td style="padding: 0;">
													<Text style={detailLabel}>
														{notificationType === 'success' ? 'From' : 'To'}
													</Text>
												</td>
												<td style="padding: 0; text-align: right;">
													<Text style={detailValue}>
														{notificationType === 'success' ? senderName : receiverName}
													</Text>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							{/if}
							<tr>
								<td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
									<table
										role="presentation"
										cellspacing="0"
										cellpadding="0"
										border="0"
										width="100%"
									>
										<tr>
											<td style="padding: 0;">
												<Text style={detailLabel}>Date</Text>
											</td>
											<td style="padding: 0; text-align: right;">
												<Text style={detailValue}>{transactionDate}</Text>
											</td>
										</tr>
									</table>
								</td>
							</tr>
							<tr>
								<td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
									<table
										role="presentation"
										cellspacing="0"
										cellpadding="0"
										border="0"
										width="100%"
									>
										<tr>
											<td style="padding: 0;">
												<Text style={detailLabel}>Status</Text>
											</td>
											<td style="padding: 0; text-align: right;">
												<Text style={detailValue}>
													{transactionStatus.charAt(0).toUpperCase() + transactionStatus.slice(1)}
												</Text>
											</td>
										</tr>
									</table>
								</td>
							</tr>
							{#if note}
								<tr>
									<td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
										<table
											role="presentation"
											cellspacing="0"
											cellpadding="0"
											border="0"
											width="100%"
										>
											<tr>
												<td style="padding: 0;">
													<Text style={detailLabel}>Note</Text>
												</td>
												<td style="padding: 0; text-align: right;">
													<Text style={detailValue}>{note}</Text>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							{/if}
							{#if transactionHash}
								<tr>
									<td style="padding: 12px 0;">
										<table
											role="presentation"
											cellspacing="0"
											cellpadding="0"
											border="0"
											width="100%"
										>
											<tr>
												<td style="padding: 0;">
													<Text style={detailLabel}>Transaction Hash</Text>
												</td>
												<td style="padding: 0; text-align: right;">
													<Text style={transactionHashStyle}>{transactionHash}</Text>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							{/if}
						</table>
					</Section>

					<!-- CTA Button -->
					{#if chapterUrl || notificationType !== 'success'}
						<Section style={ctaSection}>
							{#if chapterUrl}
								<Link href={chapterUrl} style={ctaButtonStyle}>{ctaButtonText}</Link>
							{:else}
								<Link href={`${origin}/monetize/earnings`} style={ctaButtonStyle}
									>{ctaButtonText}</Link
								>
							{/if}
							<Text style={ctaSubtext}>{ctaSubtextMessage}</Text>
						</Section>
					{/if}

					<Hr style={divider} />

					<!-- Inspirational Quote Footer -->
					<Section style={quoteSection}>
						<Section style={quoteContainer}>
							<Section style={quoteWrapper}>
								<Text style={quoteText}>
									" The scariest moment is always just before you start. After that, things can only
									get better. "
								</Text>
							</Section>
							<Text style={quoteAuthor}>— Stephen King</Text>
						</Section>
					</Section>
				</Section>

				<!-- Footer -->
				<Section style={footer}>
					<Text style={footerContact}>
						Questions? Contact us at{' '}
						<Link href="mailto:admin@axone.network" style={footerLink}>admin@axone.network</Link>
					</Text>
					<Text style={footerCopyright}>© 2025 Axone Universe. All rights reserved.</Text>
				</Section>
			</Container>
		</Section>
	</Body>
</Html>
