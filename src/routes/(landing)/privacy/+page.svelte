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
				<h3>Privacy Policy</h3>
				<h3>Information We Collect</h3>
				<h4>How We Use Your Information</h4>
				<h4>Sharing Your Information</h4>
				<h3>Your Choices and Rights</h3>
				<h3>Data Security</h3>
				<h3>Changes to This Privacy Policy</h3>
				<h3>Contact Us</h3>
			</div>
			<TableOfContents>
				<h2>Axone Universe</h2>
			</TableOfContents>
		</div>
	</div>
	<div class="flex flex-col pt-16 sm:pt-4 px-5 md:px-20 gap-5 w-full h-fit">
		<h2 class="h2">Privacy Policy</h2>
		<p>Effective Date: 1 January 2025</p>

		<p>
			This Privacy Policy explains how Axone Universe ("we," "our," or "us") collects, uses, shares,
			and protects your personal information when you use our website and services (the "Service").
			By using the Service, you agree to the terms of this Privacy Policy.
		</p>

		<h3 class="h3">1. Information We Collect</h3>
		<h4 class="h4">1.1 Information You Provide to Us</h4>
		<p>We may collect personal information that you provide to us directly, such as:</p>
		<ul>
			<li>Your name, email address, and account credentials when you register for an account.</li>
			<li>
				Content you upload or create on our platform, including text, images, and other media.
			</li>
			<li>Payment details when you make purchases through our Service.</li>
		</ul>

		<h4 class="h4">1.2 Information We Collect Automatically</h4>
		<p>When you use our Service, we may collect certain information automatically, including:</p>
		<ul>
			<li>Your IP address, browser type, and operating system.</li>
			<li>Usage data, such as pages you visit and actions you take on the Service.</li>
			<li>Device identifiers and other diagnostic data.</li>
		</ul>

		<h3 class="h3">2. How We Use Your Information</h3>
		<p>We use your information for the following purposes:</p>
		<ul>
			<li>To provide, maintain, and improve our Service.</li>
			<li>To personalize your experience and recommend content.</li>
			<li>To communicate with you, including sending updates and promotional offers.</li>
			<li>To ensure security and prevent fraud.</li>
			<li>To comply with legal obligations.</li>
		</ul>

		<h3 class="h3">3. Sharing Your Information</h3>
		<p>We may share your information with third parties in the following circumstances:</p>
		<ul>
			<li>With service providers who assist us in operating our Service.</li>
			<li>As part of a business transfer, such as a merger or acquisition.</li>
			<li>When required by law or to protect our rights and users.</li>
		</ul>

		<h3 class="h3">4. Your Choices and Rights</h3>
		<p>You have certain rights regarding your personal information, including:</p>
		<ul>
			<li>Accessing, updating, or deleting your account information.</li>
			<li>Opting out of marketing communications.</li>
			<li>Requesting a copy of your data or asking us to delete it.</li>
		</ul>
		<p>To exercise these rights, please contact us at [Insert Contact Email].</p>

		<h3 class="h3">5. Data Security</h3>
		<p>
			We implement reasonable security measures to protect your information from unauthorized access
			and disclosure. However, no method of transmission over the Internet is 100% secure.
		</p>

		<h3 class="h3">6. Changes to This Privacy Policy</h3>
		<p>
			We may update this Privacy Policy from time to time. We will notify you of any changes by
			posting the new policy on this page with an updated effective date.
		</p>

		<h3 id="contact-us" class="h3">7. Contact Us</h3>
		<p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
		<p>Email: admin@axone.network</p>

		<p>Thank you for using Axone Universe.</p>
	</div>
</div>
