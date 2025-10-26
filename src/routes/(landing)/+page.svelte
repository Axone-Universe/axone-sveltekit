<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import Container from '$lib/components/Container.svelte';
	import Author_1 from '$lib/assets/author-1.svelte';
	import Author_3 from '$lib/assets/author-3.svelte';
	import Author_4 from '$lib/assets/author-4.svelte';
	import type { SupabaseClient, Session } from '@supabase/supabase-js';
	import { goto } from '$app/navigation';
	import { users, usd, paintBrush, comments } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import UserCarousel from '$lib/components/user/UserCarousel.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { type HydratedCampaignProperties } from '$lib/properties/campaign';
	import { type HydratedDocument } from 'mongoose';
	import ImageWithFallback from '$lib/components/util/ImageWithFallback.svelte';
	import { formattedDate } from '$lib/util/studio/strings';

	export let data: { supabase: SupabaseClient; session: Session | null };

	if (data.session) {
		goto('/home');
	}

	let campaigns: HydratedDocument<HydratedCampaignProperties>[] = [];

	onMount(() => {
		trpc($page)
			.campaigns.get.query({
				limit: 6,
				open: true
			})
			.then((response) => {
				campaigns = response.data as HydratedDocument<HydratedCampaignProperties>[];
			});
	});

	const features = [
		{
			icon: users,
			title: 'Collaborate',
			description: 'Work with other authors to create branching storylines'
		},
		{
			icon: comments,
			title: 'Engage',
			description: 'Connect with readers and build your community'
		},
		{
			icon: usd,
			title: 'Monetize',
			description: 'Earn from your stories and collaborative works'
		},
		{
			icon: paintBrush,
			title: 'Illustrate',
			description: 'Bring your stories to life with visual storytelling'
		}
	];

	const testimonials = [
		{
			_id: '1',
			firstName: 'Laeeq',
			lastName: 'Orrie',
			labels: ['Writer'],
			imageURL:
				'https://ejrsceonrzysmcheplfg.supabase.co/storage/v1/object/public/profiles/6a95394a-fd2f-4137-b7e4-4c6c42d8d753/profile.jpg',
			about:
				'"Using Axone has been a delightful experience. The platform fosters collaboration on literary pieces, allowing me to learn from others and grow as a writer. The process was both enjoyable and enriching, providing a vibrant space for creativity and connection."'
		},
		{
			_id: '2',
			firstName: 'Luke',
			lastName: 'Ryan',
			labels: ['Writer'],
			imageURL:
				'https://ejrsceonrzysmcheplfg.supabase.co/storage/v1/object/public/profiles/1dcad11b-0ee0-4aca-92c1-8e5a195952d6/profile.jpg',
			about: `"When I first joined Axone, I quickly realized how much richer my storytelling became through collaboration. Working with others brings so many new ideas to the table—ideas that I would have never come up with on my own. It's amazing how a single concept can transform as different people contribute their perspectives, adding layers and depth to the plot and characters. The flow of creativity becomes so much more natural, and it's like watching your story evolve in ways that feel unexpected yet perfect. What I love most is how the process feels less like a lonely task and more like an exciting group adventure. Every new chapter, every new storyline idea, brings the work forward in ways I couldn't have imagined alone. It's easier to push past writer's block when there's a team of talented individuals supporting each other. And the best part? The energy in the creative process keeps everything moving smoothly. It's a space where ideas flow freely, and the story grows into something truly special."`
		},
		{
			_id: '3',
			firstName: 'Si-Jia',
			lastName: 'Wu',
			labels: ['Writer'],
			imageURL:
				'https://ejrsceonrzysmcheplfg.supabase.co/storage/v1/object/public/profiles/ffd875b3-02ce-4ab3-b3b2-9d2ff6979356/profile.png',
			about:
				'"I stumbled upon the Axone Universe Collaborative Writing Competition by chance and was thrilled to participate, grateful that I can share my writing with a broader audience. Although winning was an unexpected honor, I am ecstatic with the success. This experience has reinforced my love for storytelling."'
		},
		{
			_id: '4',
			firstName: 'Illiana',
			lastName: 'Norgard',
			labels: ['Writer'],
			imageURL: '',
			about:
				'"I stumbled upon the Axone Universe Collaborative Writing Competition by chance and was thrilled to participate, grateful that I can share my writing with a broader audience. Although winning was an unexpected honor, I am ecstatic with the success. This experience has reinforced my love for storytelling."'
		}
	];
</script>

<!-- Hero Section -->
<Section
	class="relative min-h-[85vh] flex items-center overflow-hidden bg-[url(/background.png)] bg-cover bg-center"
>
	<!-- Background Overlay -->
	<div class="absolute inset-0 bg-surface-50/80 dark:bg-surface-900/80" />

	<Container class="relative z-10">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
			<!-- Left Content -->
			<div class="flex flex-col space-y-6 text-center lg:text-left">
				<div class="space-y-6">
					<h1
						class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight"
					>
						Enter The Axone Universe
					</h1>
					<p class="text-md sm:text-xl lg:text-xl font-normal text-surface-600-300-token max-w-2xl">
						Collaborate with authors and illustrators to create stories with multiple storylines.
					</p>
				</div>
				<div class="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
					<a href="/login" class="btn variant-filled-primary btn-lg text-base sm:text-lg px-8 py-4">
						<span>Get Started</span>
						<i class="fa-solid fa-arrow-right-long" />
					</a>
					<a href="/learn" class="btn variant-soft-primary btn-lg text-base sm:text-lg px-8 py-4">
						Learn More
					</a>
				</div>
			</div>

			<!-- Right Content - Illustration -->
			<div class="lg:order-2 w-full max-w-[600px] mx-auto relative">
				<img src="/hero_background.png" alt="Axone Universe" class="w-full h-auto object-contain" />
			</div>
		</div>
	</Container>
</Section>

<!-- Running Campaigns Section -->
{#if campaigns.length > 0}
	<Section class="bg-surface-50-900-token">
		<Container>
			<!-- Content -->
			<div class="relative z-10 p-6">
				<div class="mb-6">
					<h2 class="text-2xl md:text-3xl font-bold mb-2">Active Writing Competitions</h2>
					<p class="text-lg text-surface-700-200-token">
						Join our current campaigns and showcase your talent
					</p>
				</div>

				<!-- Campaigns Grid -->
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					{#each campaigns as campaign}
						<a
							href="./book/{campaign.book._id}"
							class="card card-hover overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105"
						>
							<div class="aspect-[2/3] relative overflow-hidden">
								<ImageWithFallback
									src={campaign.book.imageURL}
									alt={campaign.book.title}
									class="w-full h-full object-cover"
								/>
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
								/>
								<div class="absolute bottom-0 left-0 right-0 p-2 text-white">
									<h3 class="font-bold text-sm mb-1 line-clamp-2">{campaign.book.title}</h3>
									<p class="text-xs text-white/80 line-clamp-2">{campaign.book.description}</p>
								</div>

								<!-- Hover Button Overlay -->
								<div
									class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
								>
									<div class="btn variant-filled-primary text-sm px-6 py-2">Enter Competition</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</Container>
	</Section>
{/if}

<Section>
	<Container class="flex flex-col items-center">
		<div class="text-center max-w-[700px] p-8">
			<p class="tracking-wide leading-8">
				<i>
					"Great discoveries and improvements invariably involve the cooperation of many minds. I
					may be given credit for having blazed the trail, but when I look at the subsequent
					developments I feel the credit is due to others rather than to myself." - <b
						>Alexander Graham Bell</b
					>
				</i>
			</p>
		</div>
	</Container>
</Section>

<Section class="bg-surface-100-800-token flex items-center">
	<Container>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 items-center">
			<div class="w-full max-w-full mx-auto">
				<div class="lg:order-2 w-full max-w-[600px] mx-auto relative">
					<img
						src="/publishing_1_resized.png"
						alt="Axone Universe"
						class="w-full h-auto object-contain"
					/>
				</div>
			</div>
			<div
				class="flex flex-col items-center text-center lg:text-start lg:items-start space-y-4 lg:space-y-10 max-w-[640px]"
			>
				<div class="mx-auto space-y-6">
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
						Publish Your Story
					</h2>
					<p class="text-base sm:text-lg lg:text-xl text-surface-600-300-token">
						Write and publish your story using our online platform. Keep track of your characters,
						places, notes and more. Get editorial services and constant feedback from our readers.
					</p>
				</div>
				<div class="tab-group space-y-4 max-w-[640px] mx-auto" data-testid="tab-group">
					<a href="learn" class="btn variant-soft-primary">Learn More</a>
				</div>
			</div>
		</div>
	</Container>
</Section>

<Section class="bg-surface-50-900-token flex items-center">
	<Container>
		<div class="grid grid-cols-1 lg:grid-cols-2 lg:gap-10 items-center">
			<div class="lg:order-2 w-full max-w-[400px] mx-auto">
				<div class="relative">
					<Author_1 />
				</div>
			</div>
			<div
				class="flex flex-col items-center text-center lg:text-start lg:items-start space-y-4 lg:space-y-10 max-w-[640px]"
			>
				<div class="mx-auto space-y-6">
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
						Overcome The Writer's Block
					</h2>
					<p class="text-base sm:text-lg lg:text-xl text-surface-600-300-token">
						Collaborate with the <i><b>universe</b></i>. Let other authors continue your story using
						alternate storylines. You'll be a co-owner of each storyline and receive royalties from
						them.
					</p>
				</div>
				<div class="tab-group space-y-4 max-w-[640px] mx-auto" data-testid="tab-group">
					<a href="/learn" class="btn variant-soft-primary">Learn More</a>
				</div>
			</div>
		</div>
	</Container>
</Section>

<Section class="bg-surface-100-800-token flex items-center">
	<Container>
		<div class="grid grid-cols-1 lg:grid-cols-2 md:gap-10 items-center">
			<div class="md:inline-block w-full max-w-[400px] mx-auto">
				<div class="relative">
					<Author_4 />
				</div>
			</div>
			<div
				class="flex flex-col items-center text-center lg:text-start lg:items-start space-y-4 lg:space-y-10 max-w-[640px]"
			>
				<div class="mx-auto space-y-6">
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
						Bring Your Story To Life
					</h2>
					<p class="text-base sm:text-lg lg:text-xl text-surface-600-300-token">
						Create a call for collaboration with Editors, Illustrators and other Authors to bring
						your story to life.
					</p>
				</div>
				<div class="tab-group space-y-4 max-w-[640px] mx-auto" data-testid="tab-group">
					<a href="/learn" class="btn variant-soft-primary">Learn More</a>
				</div>
			</div>
		</div>
	</Container>
</Section>

<!-- Testimonials Section -->
<Section class="bg-surface-50-900-token">
	<Container>
		<UserCarousel users={testimonials} />
	</Container>
</Section>
