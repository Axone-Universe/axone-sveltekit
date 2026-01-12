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

	export let chapterTitle: string;
	export let bookTitle: string;
	export let commenterName: string;
	export let commenterImageURL: string | undefined;
	export let commentText: string;
	export let commentDate: string;
	export let chapterUrl: string;
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

	const badge = {
		display: 'inline-block',
		padding: '8px 16px',
		borderRadius: '9999px',
		fontSize: '14px',
		fontWeight: '600',
		backgroundColor: '#dbf5ec',
		color: '#0b8c61',
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

	const commentSection = {
		backgroundColor: '#f8f9fa',
		border: '1px solid #e5e7eb',
		borderRadius: '12px',
		padding: '24px',
		marginBottom: '32px'
	};

	const commenterInfo = {
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
		marginBottom: '16px'
	};

	const avatarContainer = {
		width: '48px',
		height: '48px',
		borderRadius: '50%',
		overflow: 'hidden',
		border: '2px solid #e5e7eb',
		display: 'block',
		flexShrink: 0
	};

	const avatarStyle = {
		width: '48px',
		height: '48px',
		display: 'block',
		objectFit: 'cover' as const
	};

	const commenterNameStyle = {
		fontFamily,
		fontSize: '18px',
		fontWeight: '600',
		color: '#111827',
		margin: '0',
		lineHeight: '1.4'
	};

	const commentDateStyle = {
		fontFamily,
		fontSize: '14px',
		color: '#6b7280',
		margin: '4px 0 0 0',
		lineHeight: '1.4'
	};

	const commentTextStyle = {
		fontFamily,
		fontSize: '16px',
		color: '#374151',
		lineHeight: '1.75',
		margin: '0',
		whiteSpace: 'pre-wrap' as const
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

	// Format the comment date
	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return dateString;
		}
	};
</script>

<Html>
	<Head />
	<Preview preview="New Comment on {chapterTitle}">New Comment on {chapterTitle}</Preview>
	<Body style={main}>
		<Section style={wrapper}>
			<Container style={container}>
				<!-- Header with Logo -->
				<Section style={header}>
					<Img
						src="{origin}/logo_banner.png"
						alt="Logo"
						width="w-full"
						height="h-full"
						style={logo}
					/>
					<Heading style={headerTitle}>New Comment</Heading>
					<Section style={headerDivider} />
				</Section>

				<!-- Main Content -->
				<Section style={content}>
					<!-- Chapter Title -->
					<Section style={titleSection}>
						<Text style={badge}>💬 New Comment</Text>
						<Heading style={chapterTitleStyle}>{chapterTitle}</Heading>
						<Text style={bookTitleStyle}>from {bookTitle}</Text>
					</Section>

					<!-- Comment Section -->
					<Section style={commentSection}>
						<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
							<tr>
								<td style="padding: 0; vertical-align: top;">
									<!-- Commenter Avatar -->
									<Section style={avatarContainer}>
										<Img
											src={commenterImageURL || `${origin}/default-user.png`}
											alt={commenterName}
											width="48"
											height="48"
											style={avatarStyle}
										/>
									</Section>
								</td>
								<td style="padding: 0 0 0 16px; vertical-align: top; width: 100%;">
									<!-- Commenter Name -->
									<Text style={commenterNameStyle}>{commenterName}</Text>
									<Text style={commentDateStyle}>{formatDate(commentDate)}</Text>
								</td>
							</tr>
						</table>
						<!-- Comment Text -->
						<Section style="margin-top: 16px;">
							<Text style={commentTextStyle}>{commentText}</Text>
						</Section>
					</Section>

					<!-- CTA Button -->
					<Section style={ctaSection}>
						<Link href={chapterUrl} style={ctaButton}>View Chapter</Link>
						<Text style={ctaSubtext}>Read the full conversation and join the discussion</Text>
					</Section>

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
