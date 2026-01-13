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
	export let campaignDescription: string;
	export let startDate: string;
	export let endDate: string;
	export let criteria: { value: string; link?: string }[];
	export let rewards: { value: string; link?: string }[];
	export let resources: { value: string; link?: string }[];
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

	const datesContainer = {
		textAlign: 'center' as const,
		marginTop: '16px'
	};

	const datesTable =
		'width: auto; margin: 0 auto; border-collapse: separate; border-spacing: 16px;';

	const datesTableCell = 'padding: 0; vertical-align: middle;';

	const dateBox = {
		width: '80px',
		borderRadius: '12px',
		overflow: 'hidden',
		display: 'inline-block',
		border: '1px solid #e5e7eb',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
	};

	const dateBoxTable = 'width: 80px; border-collapse: collapse;';

	const dateBoxTopStart =
		'height: 40px; background-color: #0FBA81; padding: 4px 8px; text-align: center; vertical-align: middle;';

	const dateBoxTopEnd =
		'height: 40px; background-color: #DC2626; padding: 4px 8px; text-align: center; vertical-align: middle;';

	const dateBoxMonth = {
		fontFamily,
		fontSize: '11px',
		fontWeight: '600',
		color: '#ffffff',
		textTransform: 'uppercase' as const,
		lineHeight: '1.2',
		margin: '0',
		display: 'block'
	};

	const dateBoxYear = {
		fontFamily,
		fontSize: '10px',
		fontWeight: '400',
		color: '#ffffff',
		opacity: 0.9,
		lineHeight: '1.2',
		margin: '0',
		display: 'block'
	};

	const dateBoxBottom =
		'height: 40px; background-color: #ffffff; padding: 4px; text-align: center; vertical-align: middle;';

	const dateBoxDay = {
		fontFamily,
		fontSize: '24px',
		fontWeight: 'bold',
		color: '#111827',
		lineHeight: '1',
		margin: '0'
	};

	const dateSeparator = {
		fontSize: '20px',
		color: '#9ca3af',
		display: 'inline-block',
		verticalAlign: 'middle'
	};

	// Helper function to parse date and extract parts
	const parseDate = (dateString: string) => {
		const date = new Date(dateString);
		const month = date.toLocaleString('en-US', { month: 'short' });
		const year = date.getFullYear().toString();
		const day = date.getDate().toString();
		return { month, year, day };
	};

	const description = {
		marginBottom: '40px'
	};

	const descriptionText = {
		fontFamily,
		fontSize: '18px',
		color: '#374151',
		lineHeight: '1.75',
		margin: '0'
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

	const iconCirclePurple = {
		...iconCircle,
		backgroundColor: '#dbf5ec'
	};

	const iconCircleAmber = {
		...iconCircle,
		backgroundColor: '#fcf4da'
	};

	const iconCircleBlue = {
		...iconCircle,
		backgroundColor: '#E8E6FF'
	};

	const icon = {
		fontSize: '20px'
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

	const criteriaCard = {
		backgroundColor: '#e2e5e5',
		border: '1px solid #b2b9bb',
		borderRadius: '8px',
		padding: '24px',
		marginLeft: '52px'
	};

	const rewardsCard = {
		backgroundColor: '#e5e3fb',
		border: '1px solid #b9b5f5',
		borderRadius: '8px',
		padding: '24px',
		marginLeft: '52px'
	};

	const list = {
		listStyle: 'none',
		padding: '0',
		margin: '0'
	};

	const listItem = {
		marginBottom: '16px',
		paddingLeft: '52px'
	};

	const listItemTable = 'width: 100%; border-collapse: collapse; margin-bottom: 16px;';

	const iconCell = 'padding: 0; vertical-align: top; width: 32px; padding-right: 12px;';

	const textCell = 'padding: 0; vertical-align: top;';

	const checkmark = {
		width: '20px',
		height: '20px',
		display: 'block'
	};

	const star = {
		width: '20px',
		height: '20px',
		display: 'block'
	};

	const arrow = {
		width: '20px',
		height: '20px',
		display: 'block'
	};

	const sectionIcon = {
		display: 'block',
		width: '40px',
		height: '40px',
		margin: '0 auto'
	};

	const listText = {
		color: '#374151',
		margin: '0',
		lineHeight: '1.5',
		padding: '0'
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

	const quoteMark = {
		fontSize: '64px',
		color: '#c3eee0',
		position: 'absolute' as const
	};

	const quoteMarkOpen = {
		...quoteMark,
		top: '-16px',
		left: '-8px'
	};

	const quoteMarkClose = {
		...quoteMark,
		bottom: '-32px',
		right: '-8px'
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
	<Preview preview="New Campaign: {campaignTitle}">New Campaign: {campaignTitle}</Preview>
	<Body style={main}>
		<Section style={wrapper}>
			<Container style={container}>
				<!-- Header with Logo -->
				<Section style={header}>
					<Img src="{origin}/logo_banner.png" alt="Logo" width="400" height="auto" style={logo} />
					<Heading style={headerTitle}>New Campaign Announcement</Heading>
					<Section style={headerDivider} />
				</Section>

				<!-- Main Content -->
				<Section style={content}>
					<!-- Campaign Title -->
					<Section style={campaignTitleSection}>
						<Text style={badge}>Featured Campaign</Text>
						<Heading style={campaignTitleStyle}>{campaignTitle}</Heading>
						<Section style={datesContainer}>
							{@const startDateParts = parseDate(startDate)}
							{@const endDateParts = parseDate(endDate)}
							<table
								style={datesTable}
								role="presentation"
								cellspacing="0"
								cellpadding="0"
								border="0"
							>
								<tr>
									<td style={datesTableCell}>
										<!-- Start Date Box -->
										<Section style={dateBox}>
											<table
												style={dateBoxTable}
												role="presentation"
												cellspacing="0"
												cellpadding="0"
												border="0"
											>
												<tr>
													<td style={dateBoxTopStart}>
														<Text style={dateBoxMonth}>{startDateParts.month}</Text>
														<Text style={dateBoxYear}>{startDateParts.year}</Text>
													</td>
												</tr>
												<tr>
													<td style={dateBoxBottom}>
														<Text style={dateBoxDay}>{startDateParts.day}</Text>
													</td>
												</tr>
											</table>
										</Section>
									</td>
									<td style={datesTableCell}>
										<Text style={dateSeparator}>→</Text>
									</td>
									<td style={datesTableCell}>
										<!-- End Date Box -->
										<Section style={dateBox}>
											<table
												style={dateBoxTable}
												role="presentation"
												cellspacing="0"
												cellpadding="0"
												border="0"
											>
												<tr>
													<td style={dateBoxTopEnd}>
														<Text style={dateBoxMonth}>{endDateParts.month}</Text>
														<Text style={dateBoxYear}>{endDateParts.year}</Text>
													</td>
												</tr>
												<tr>
													<td style={dateBoxBottom}>
														<Text style={dateBoxDay}>{endDateParts.day}</Text>
													</td>
												</tr>
											</table>
										</Section>
									</td>
								</tr>
							</table>
						</Section>
					</Section>

					<!-- Campaign Description -->
					<Section style={description}>
						<Text style={descriptionText}>{campaignDescription}</Text>
					</Section>

					<!-- Submission Criteria Section -->
					<Section style={section}>
						<Section style={sectionHeader}>
							<Section style={iconCirclePurple}>
								<Img
									src={getIconUrl('pencil-circle')}
									alt="Pencil icon"
									width="40"
									height="40"
									style={sectionIcon}
								/>
							</Section>
							<Heading style={sectionTitle}>Submission Criteria</Heading>
						</Section>
						{#each criteria as criterion}
							<Section style={listItem}>
								<table
									style={listItemTable}
									role="presentation"
									cellspacing="0"
									cellpadding="0"
									border="0"
								>
									<tr>
										<td style={iconCell}>
											<Img
												src={getIconUrl('check-circle')}
												alt="Check icon"
												width="20"
												height="20"
												style={checkmark}
											/>
										</td>
										<td style={textCell}>
											<Text style={listText}>{criterion.value}</Text>
										</td>
									</tr>
								</table>
							</Section>
						{/each}
					</Section>

					<!-- Rewards Section -->
					<Section style={section}>
						<Section style={sectionHeader}>
							<Section style={iconCircleAmber}>
								<Img
									src={getIconUrl('trophy')}
									alt="Lightning icon"
									width="20"
									height="20"
									style={sectionIcon}
								/>
							</Section>
							<Heading style={sectionTitle}>Rewards & Recognition</Heading>
						</Section>
						{#each rewards as rewardItem}
							<Section style={listItem}>
								<table
									style={listItemTable}
									role="presentation"
									cellspacing="0"
									cellpadding="0"
									border="0"
								>
									<tr>
										<td style={iconCell}>
											<Img
												src={getIconUrl('star')}
												alt="Star icon"
												width="20"
												height="20"
												style={star}
											/>
										</td>
										<td style={textCell}>
											<Text style={listText}>{rewardItem.value}</Text>
										</td>
									</tr>
								</table>
							</Section>
						{/each}
					</Section>

					<!-- Resources Section -->
					{#if resources && resources.length > 0}
						<Section style={section}>
							<Section style={sectionHeader}>
								<Section style={iconCircleBlue}>
									<Img
										src={getIconUrl('tools')}
										alt="Settings icon"
										width="20"
										height="20"
										style={sectionIcon}
									/>
								</Section>
								<Heading style={sectionTitle}>Tools & Resources</Heading>
							</Section>
							{#each resources as resourceItem}
								<Section style={listItem}>
									<table
										style={listItemTable}
										role="presentation"
										cellspacing="0"
										cellpadding="0"
										border="0"
									>
										<tr>
											<td style={iconCell}>
												<Img
													src={getIconUrl('settings')}
													alt="Arrow icon"
													width="20"
													height="20"
													style={arrow}
												/>
											</td>
											<td style={textCell}>
												<Text style={listText}>{resourceItem.value}</Text>
											</td>
										</tr>
									</table>
								</Section>
							{/each}
						</Section>
					{/if}

					<!-- CTA Button -->
					<Section style={ctaSection}>
						<Link href={campaignUrl} style={ctaButton}>✨ Join the Campaign</Link>
						<Text style={ctaSubtext}>Limited spots available • First come, first served</Text>
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
