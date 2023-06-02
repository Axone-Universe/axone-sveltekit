<script lang="ts">
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import type { PageData } from './$types';
	import { Avatar } from '@skeletonlabs/skeleton';

	export let data: PageData;

	const { campaigns } = data;
	const thisCampaign = campaigns.filter(
		(campaign) => campaign.id === $page.url.pathname.split('/').pop()
	)[0];
</script>

<Container>
	<div class="card overflow-hidden">
		<header>
			<img
				src={thisCampaign.bannerURL}
				class="bg-black/50 w-full aspect-[21/3]"
				alt={`${thisCampaign.title} banner`}
			/>
		</header>
		<div class="p-4 space-y-16">
			<div class="space-y-4">
				<h1>{thisCampaign.title}</h1>
				<a href={thisCampaign.organizer.link}>By {thisCampaign.organizer.name}</a>
			</div>
			<div class="space-y-4">
				<h2>About</h2>
				<p style="white-space: pre-line">{thisCampaign.about}</p>
			</div>
			<div class="space-y-4">
				<h2>Submission Criteria</h2>
				<p style="white-space: pre-line">{thisCampaign.submissionCriteria}</p>
			</div>
			<div class="space-y-4">
				<h2>Rewards</h2>
				<p style="white-space: pre-line">{thisCampaign.rewards}</p>
			</div>
			<div class="space-y-4">
				<h2>Current Submissions</h2>
				<div class="embla" use:emblaCarouselSvelte>
					<div class="embla__container m-4 space-x-4">
						<div class="embla__slide card p-4 shadow-lg overflow-hidden max-w-[300px] text-token">
							<header class="flex flex-col items-center">
								<Avatar
									src="https://source.unsplash.com/YOErFW8AfkI/128x128"
									width="w-32"
									rounded="rounded-full"
								/>
							</header>
							<div class="p-4 space-y-4 flex flex-col items-center">
								<h2 class="unstyled">Takunda Chirema</h2>
								<article>
									<p class="opacity-75">
										<i>"Axone has allowed me to publish and monetize my unfinished book"</i>
									</p>
								</article>
							</div>
							<hr class="opacity-50" />
							<footer class="p-4 flex justify-center items-center space-x-4">
								<div class="flex justify-center space-x-2">
									<span class="chip bg-primary-500 hover:variant-filled"
										><i class="fa-solid fa-heart" /> <span>Author</span></span
									>
									<span class="chip bg-error-300 hover:error-filled"
										><i class="fa-solid fa-paperclip" /> <span>Editor</span></span
									>
									<span class="chip variant-soft hover:variant-filled"
										><i class="fa-solid fa-share" /> <span>Writer</span></span
									>
								</div>
							</footer>
						</div>
						<div class="embla__slide card p-4 shadow-lg overflow-hidden max-w-[300px] text-token">
							<header class="flex flex-col items-center">
								<Avatar
									src="https://source.unsplash.com/YOErFW8AfkI/128x128"
									width="w-32"
									rounded="rounded-full"
								/>
							</header>
							<div class="p-4 space-y-4 flex flex-col items-center">
								<h2 class="unstyled">Lindi Kers</h2>
								<article>
									<p class="opacity-75">
										<i
											>"I have found inspiration for continuing my stories and my creativity has
											been awakened"</i
										>
									</p>
								</article>
							</div>
							<hr class="opacity-50" />
							<footer class="p-4 flex justify-center items-center space-x-4">
								<div class="flex justify-center space-x-2">
									<span class="chip bg-primary-500 hover:variant-filled"
										><i class="fa-solid fa-heart" /> <span>Author</span></span
									>
									<span class="chip bg-error-300 hover:error-filled"
										><i class="fa-solid fa-paperclip" /> <span>Editor</span></span
									>
									<span class="chip variant-soft hover:variant-filled"
										><i class="fa-solid fa-share" /> <span>Writer</span></span
									>
								</div>
							</footer>
						</div>
						<div class="embla__slide card p-4 shadow-lg overflow-hidden max-w-[300px] text-token">
							<header class="flex flex-col items-center">
								<Avatar
									src="https://source.unsplash.com/YOErFW8AfkI/128x128"
									width="w-32"
									rounded="rounded-full"
								/>
							</header>
							<div class="p-4 space-y-4 flex flex-col items-center">
								<h2 class="unstyled">Danae Bouwer</h2>
								<article>
									<p class="opacity-75">
										<i
											>"It is quite fun to explore the different authors, storylines and
											illustrations of artists. I love it!"</i
										>
									</p>
								</article>
							</div>
							<hr class="opacity-50" />
							<footer class="p-4 flex justify-center items-center space-x-4">
								<div class="flex justify-center space-x-2">
									<span class="chip bg-primary-500 hover:variant-filled"
										><i class="fa-solid fa-heart" /> <span>Author</span></span
									>
									<span class="chip bg-error-300 hover:error-filled"
										><i class="fa-solid fa-paperclip" /> <span>Editor</span></span
									>
									<span class="chip variant-soft hover:variant-filled"
										><i class="fa-solid fa-share" /> <span>Writer</span></span
									>
								</div>
							</footer>
						</div>
					</div>
				</div>
			</div>
			<div class="space-y-4">
				<button class="btn variant-filled-primary">Submit</button>
			</div>
		</div>
	</div>
</Container>
