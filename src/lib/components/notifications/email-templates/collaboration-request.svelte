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
	import type { PermissionedDocument } from '$lib/properties/permission';

	export let requesterName: string;
	export let requesterImageURL: string | undefined;
	export let documentType: PermissionedDocument;
	export let documentTitle: string;
	export let documentUrl: string;
	export let origin: string;
	export let isOwner: boolean = false;

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

	const documentTitleStyle = {
		fontFamily,
		fontSize: '30px',
		fontWeight: 'bold',
		color: '#111827',
		margin: '0 0 12px 0',
		lineHeight: '1.3'
	};

	const documentTypeStyle = {
		fontFamily,
		fontSize: '16px',
		color: '#6b7280',
		margin: '0',
		textTransform: 'capitalize' as const
	};

	const requesterSection = {
		marginBottom: '32px',
		padding: '24px',
		backgroundColor: '#f9fafb',
		borderRadius: '12px',
		border: '1px solid #e5e7eb'
	};

	const requesterContainer = {
		display: 'flex',
		alignItems: 'center',
		gap: '16px'
	};

	const avatarContainer = {
		width: '64px',
		height: '64px',
		borderRadius: '50%',
		overflow: 'hidden',
		border: '2px solid #e5e7eb',
		display: 'block',
		flexShrink: 0
	};

	const avatarStyle = {
		width: '100%',
		height: '100%',
		objectFit: 'cover' as const,
		display: 'block'
	};

	const requesterInfo = {
		flex: '1'
	};

	const requesterNameStyle = {
		fontFamily,
		fontSize: '20px',
		fontWeight: '600',
		color: '#111827',
		margin: '0 0 4px 0',
		lineHeight: '1.3'
	};

	const requesterLabelStyle = {
		fontFamily,
		fontSize: '14px',
		color: '#6b7280',
		margin: '0'
	};

	const description = {
		marginBottom: '32px'
	};

	const descriptionText = {
		fontFamily,
		fontSize: '18px',
		color: '#374151',
		lineHeight: '1.75',
		margin: '0'
	};

	const highlightBox = {
		backgroundColor: '#E8E6FF',
		borderLeft: '4px solid #4F46E5',
		borderRadius: '8px',
		padding: '20px',
		marginBottom: '32px'
	};

	const highlightText = {
		fontFamily,
		fontSize: '16px',
		color: '#4F46E5',
		fontWeight: '600',
		margin: '0',
		lineHeight: '1.5'
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
	<Preview
		preview={isOwner
			? `You've been added as a collaborator: ${requesterName} has added you to ${documentTitle}`
			: `Collaboration Request: ${requesterName} wants to collaborate on ${documentTitle}`}
	>
		{isOwner
			? `You've been added as a collaborator: ${requesterName} has added you to ${documentTitle}`
			: `Collaboration Request: ${requesterName} wants to collaborate on ${documentTitle}`}
	</Preview>
	<Body style={main}>
		<Section style={wrapper}>
			<Container style={container}>
				<!-- Header with Logo -->
				<Section style={header}>
					<Img src="{origin}/logo_banner.png" alt="Logo" width="400" height="auto" style={logo} />
					<Heading style={headerTitle}>
						{isOwner ? "You've Been Added as a Collaborator" : 'Collaboration Request'}
					</Heading>
					<Section style={headerDivider} />
				</Section>

				<!-- Main Content -->
				<Section style={content}>
					<!-- Title Section -->
					<Section style={titleSection}>
						<Text style={badge}>{isOwner ? "✨ You've Been Added" : '🤝 New Request'}</Text>
						<Heading style={documentTitleStyle}>{documentTitle}</Heading>
						<Text style={documentTypeStyle}>{documentType}</Text>
					</Section>

					<!-- Requester Section -->
					<Section style={requesterSection}>
						<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
							<tr>
								<td style="padding: 0; vertical-align: middle;">
									<Section style={avatarContainer}>
										<Img
											src={requesterImageURL || `${origin}/default-user.png`}
											alt={requesterName}
											width="64"
											height="64"
											style={avatarStyle}
										/>
									</Section>
								</td>
								<td style="padding: 0 0 0 16px; vertical-align: middle; width: 100%;">
									<Text style={requesterNameStyle}>{requesterName}</Text>
									<Text style={requesterLabelStyle}>
										{isOwner ? 'has added you as a collaborator' : 'wants to collaborate with you'}
									</Text>
								</td>
							</tr>
						</table>
					</Section>

					<!-- Description -->
					<Section style={description}>
						<Text style={descriptionText}>
							{#if isOwner}
								<strong>{requesterName}</strong> has added you as a collaborator to their{' '}
								<strong>{documentType.toLowerCase()}</strong> "<strong>{documentTitle}</strong>".
							{:else}
								<strong>{requesterName}</strong> has requested permission to collaborate on your{' '}
								<strong>{documentType.toLowerCase()}</strong> "<strong>{documentTitle}</strong>".
							{/if}
						</Text>
					</Section>

					<!-- Highlight Box -->
					<Section style={highlightBox}>
						<Text style={highlightText}>
							{#if isOwner}
								💡 You now have access to collaborate on this document. You can view, edit, and
								contribute to the work. The owner maintains full control and can manage permissions
								at any time.
							{:else}
								💡 You can review and manage collaboration permissions for this document. Accept or
								decline the request to control who can collaborate with you.
							{/if}
						</Text>
					</Section>

					<!-- CTA Button -->
					<Section style={ctaSection}>
						<Link href={documentUrl} style={ctaButton}>
							{isOwner ? 'View Document' : 'Review Collaboration Request'}
						</Link>
						<Text style={ctaSubtext}>
							{isOwner
								? 'Click to view the document and start collaborating'
								: 'Click to view the document and manage permissions'}
						</Text>
					</Section>

					<Hr style={divider} />

					<!-- Additional Info -->
					<Section style={description}>
						<Text style={descriptionText}>
							{#if isOwner}
								As a collaborator, you can work together with the owner and other collaborators on
								this document. Your contributions will be visible to all collaborators.
							{:else}
								When you accept a collaboration request, the collaborator will be able to view and
								contribute to your work. You maintain full control and can revoke access at any
								time.
							{/if}
						</Text>
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
