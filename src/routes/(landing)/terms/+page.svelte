<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import { TableOfContents, tocCrawler } from '@skeletonlabs/skeleton';
</script>

<div class="flex min-h-screen relative w-full">
	<div
		class="min-h-screen rounded-lg m-2 top-16 hidden sm:flex flex-col justify-between w-[25%] bg-surface-100-800-token pt-4 pb-24 p-4 gap-2"
	>
		<div class="fixed flex flex-col gap-2">
			<div use:tocCrawler={{ mode: 'generate' }} class="hidden">
				<h3>Terms and Conditions</h3>
				<h3>Use of the Service</h3>
				<h4>Prohibited Activities</h4>
				<h4>Intellectual Property</h4>
				<h3>Termination</h3>
				<h3>Disclaimer of Warranties</h3>
				<h3>Changes to the Terms</h3>
				<h3>Governing Law</h3>
				<h3>contact Us</h3>
			</div>
			<TableOfContents>
				<h2>Axone Universe</h2>
			</TableOfContents>
		</div>
	</div>
	<div class="flex flex-col pt-16 sm:pt-4 px-5 md:px-20 gap-5 w-full h-fit">
		<h2 class="h2">Terms and Conditions</h2>
		<p>Effective Date: 1 January 2025</p>

		<p>
			Welcome to Axone Universe ("we," "our," or "us"). By using our website and services (the
			"Service"), you agree to be bound by the following terms and conditions ("Terms"). Please read
			them carefully.
		</p>

		<h3 class="h3">1. Use of the Service</h3>
		<ul>
			<li>You must be at least 13 years old to use our Service.</li>
			<li>
				You agree to use the Service only for lawful purposes and in accordance with these Terms.
			</li>
			<li>
				You are responsible for the security of your account and any activity conducted under your
				account.
			</li>
		</ul>

		<h3 class="h3">2. User Content</h3>
		<p>
			When you upload, post, or share content on our platform ("User Content"), you grant us a
			non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and distribute your
			content for the purpose of operating and promoting the Service.
		</p>
		<ul>
			<li>You retain ownership of your User Content.</li>
			<li>
				You represent and warrant that you have the rights to share your User Content and that it
				does not infringe on any third-party rights.
			</li>
			<li>
				We reserve the right to remove or disable any User Content that violates these Terms or our
				policies.
			</li>
		</ul>

		<h3 class="h3">3. Prohibited Activities</h3>
		<p>While using the Service, you agree not to:</p>
		<ul>
			<li>Engage in any illegal or unauthorized activities.</li>
			<li>Post content that is defamatory, obscene, or otherwise harmful.</li>
			<li>Harass, abuse, or harm other users.</li>
			<li>Interfere with the operation of the Service or its security features.</li>
		</ul>

		<h3 class="h3">4. Intellectual Property</h3>
		<p>
			All content and materials provided on the Service, excluding User Content, are the
			intellectual property of [Your Website Name] or its licensors. You may not use, reproduce, or
			distribute any such materials without prior written permission.
		</p>

		<h3 class="h3">5. Termination</h3>
		<p>
			We may suspend or terminate your access to the Service at our sole discretion, without notice,
			if you violate these Terms or engage in any prohibited activities.
		</p>

		<h3 class="h3">6. Disclaimer of Warranties</h3>
		<p>
			The Service is provided "as is" and "as available" without any warranties, express or implied.
			We do not guarantee that the Service will be uninterrupted or error-free.
		</p>

		<h3 class="h3">7. Limitation of Liability</h3>
		<p>
			To the fullest extent permitted by law, we shall not be liable for any indirect, incidental,
			or consequential damages arising out of your use of the Service.
		</p>

		<h3 class="h3">8. Changes to the Terms</h3>
		<p>
			We may update these Terms from time to time. Continued use of the Service after any changes
			constitutes your acceptance of the revised Terms.
		</p>

		<h3 class="h3">9. Governing Law</h3>
		<p>
			These Terms shall be governed by and construed in accordance with the laws of South Africa.
		</p>

		<h3 class="h3">10. Contact Us</h3>
		<p>If you have any questions or concerns about these Terms, please contact us at:</p>
		<p>Email: admin@axone.network</p>

		<p>Thank you for using Axone Universe.</p>
	</div>
</div>
