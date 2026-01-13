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

	export let campaignTitle: string;
	export let winners: {
		firstName: string;
		lastName: string;
		imageURL?: string;
		position: number;
	}[];
	export let campaignUrl: string;
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

	const campaignTitleSection = {
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

	const campaignTitleStyle = {
		fontFamily,
		fontSize: '30px',
		fontWeight: 'bold',
		color: '#111827',
		margin: '0 0 12px 0',
		lineHeight: '1.3'
	};

	const description = {
		marginBottom: '40px'
	};

	const descriptionText = {
		fontFamily,
		fontSize: '18px',
		color: '#374151',
		lineHeight: '1.75',
		margin: '0',
		textAlign: 'center' as const
	};

	const section = {
		marginBottom: '40px'
	};

	const sectionHeader = {
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
		marginBottom: '16px'
	};

	const iconCircle = {
		width: '40px',
		height: '40px',
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0
	};

	const iconCircleAmber = {
		...iconCircle,
		backgroundColor: '#fcf4da'
	};

	// Icon image URLs - using circled PNG icons
	const getIconUrl = (iconName: string) => `${origin}/icons/${iconName}.png`;

	const sectionTitle = {
		fontFamily,
		fontSize: '24px',
		fontWeight: 'bold',
		color: '#111827',
		margin: '0'
	};

	const listItem = {
		marginBottom: '16px'
	};

	const listItemTable = 'width: 100%; border-collapse: collapse; margin-bottom: 16px;';

	const winnerCard = {
		backgroundColor: '#f8f9fa',
		border: '1px solid #e5e7eb',
		borderRadius: '8px',
		padding: '20px',
		marginBottom: '12px'
	};

	const winnerTable = 'width: 100%; border-collapse: collapse;';

	const winnerCell = 'padding: 0; vertical-align: middle;';

	const medalCell = 'padding: 0 12px 0 0; vertical-align: middle; width: 40px;';

	const avatarCell = 'padding: 0 12px 0 0; vertical-align: middle; width: 56px;';

	const winnerInfoCell = 'padding: 0; vertical-align: middle;';

	const avatarContainer = {
		width: '56px',
		height: '56px',
		borderRadius: '50%',
		overflow: 'hidden',
		border: '2px solid #e5e7eb',
		display: 'block'
	};

	const avatarStyle = {
		width: '56px',
		height: '56px',
		display: 'block',
		objectFit: 'cover' as const
	};

	const winnerName = {
		fontFamily,
		fontSize: '18px',
		fontWeight: '600',
		color: '#111827',
		margin: '0',
		lineHeight: '1.4'
	};

	const medalEmoji = {
		fontSize: '32px',
		lineHeight: '1',
		margin: '0'
	};

	const positionText = {
		fontFamily,
		fontSize: '16px',
		fontWeight: '600',
		color: '#4F46E5',
		margin: '0'
	};

	const sectionIcon = {
		display: 'block',
		width: '40px',
		height: '40px',
		margin: '0 auto'
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
</script>

<Html>
	<Head />
	<Preview preview="Campaign Winners: {campaignTitle}">Campaign Winners: {campaignTitle}</Preview>
	<Body style={main}>
		<Section style={wrapper}>
			<Container style={container}>
				<!-- Header with Logo -->
				<Section style={header}>
					<Img src="{origin}/logo_banner.png" alt="Logo" width="400" height="auto" style={logo} />
					<Heading style={headerTitle}>Campaign Winners</Heading>
					<Section style={headerDivider} />
				</Section>

				<!-- Main Content -->
				<Section style={content}>
					<!-- Campaign Title -->
					<Section style={campaignTitleSection}>
						<Text style={badge}>🎉 Congratulations 🎉</Text>
						<Heading style={campaignTitleStyle}>{campaignTitle}</Heading>
					</Section>

					<!-- Description -->
					<Section style={description}>
						<Text style={descriptionText}>
							Congratulations to all the winners! Thank you to everyone who participated in this
							campaign.
						</Text>
					</Section>

					<!-- Winners Section -->
					<Section style={section}>
						<Section style={sectionHeader}>
							<Section style={iconCircleAmber}>
								<Img
									src={getIconUrl('trophy')}
									alt="Trophy icon"
									width="40"
									height="40"
									style={sectionIcon}
								/>
							</Section>
							<Heading style={sectionTitle}>Winners</Heading>
						</Section>
						{#each winners as winner}
							<Section style={listItem}>
								<Section style={winnerCard}>
									<table
										style={winnerTable}
										role="presentation"
										cellspacing="0"
										cellpadding="0"
										border="0"
									>
										<tr>
											<td style={medalCell}>
												<Text style={medalEmoji}>
													{winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : '🥉'}
												</Text>
											</td>
											<td style={avatarCell}>
												<Section style={avatarContainer}>
													<Img
														src={winner.imageURL || `${origin}/default-user.png`}
														alt="{winner.firstName} {winner.lastName}"
														width="56"
														height="56"
														style={avatarStyle}
													/>
												</Section>
											</td>
											<td style={winnerInfoCell}>
												<Text style={winnerName}>
													#{winner.position}: {winner.firstName}
													{winner.lastName}
												</Text>
											</td>
										</tr>
									</table>
								</Section>
							</Section>
						{/each}
					</Section>

					<!-- CTA Button -->
					<Section style={ctaSection}>
						<Link href={campaignUrl} style={ctaButton}>View Campaign</Link>
						<Text style={ctaSubtext}>See all campaign details and results</Text>
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
