<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import Container from '$lib/components/Container.svelte';
	import emblaCarouselSvelte, { type EmblaCarouselType } from 'embla-carousel-svelte';
	import AutoPlay from 'embla-carousel-autoplay';

	import Author_1 from '$lib/assets/author-1.svelte';
	import Author_3 from '$lib/assets/author-3.svelte';
	import Author_4 from '$lib/assets/author-4.svelte';
	import Components from '$lib/components/hero/components.svelte';
	import type { SupabaseClient, Session } from '@supabase/supabase-js';
	import { goto } from '$app/navigation';
	import DocumentCarousel from '$lib/components/documents/DocumentCarousel.svelte';
	import { calendar, checkCircle, dotCircleO, trophy } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { type HydratedCampaignProperties } from '$lib/properties/campaign';
	import { HydratedDocument } from 'mongoose';
	import ImageWithFallback from '$lib/components/util/ImageWithFallback.svelte';
	import { formattedDate } from '$lib/util/studio/strings';
	import { modeCurrent, popup, type PopupSettings } from '@skeletonlabs/skeleton';

	export let data: { supabase: SupabaseClient; session: Session | null };

	if (data.session) {
		goto('/home');
	}

	const autoplay = AutoPlay({ delay: 5000 });
	const infoPopup = (target: string): PopupSettings => {
		return {
			event: 'click',
			target: target,
			placement: 'top'
		};
	};

	let emblaApi: EmblaCarouselType;
	$: selectedIndex = 0;

	let campaigns: HydratedDocument<HydratedCampaignProperties>[];
	$: campaigns = [];

	onMount(() => {
		trpc($page)
			.campaigns.get.query({
				limit: 3,
				open: true
			})
			.then((response) => {
				campaigns = response.data as HydratedDocument<HydratedCampaignProperties>[];
			});
	});

	function onInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail;
		emblaApi.on('scroll', (event: EmblaCarouselType) => {
			selectedIndex = event.selectedScrollSnap();
		});
	}

	function selectSlide(index: number) {
		emblaApi.scrollTo(index, false);
		selectedIndex = index;
	}
</script>

<Section class="bg-surface-100-800-token flex flex-col items-center !w-full">
	<div class="embla w-full" on:emblaInit={onInit} use:emblaCarouselSvelte={{ plugins: [autoplay] }}>
		<div class="embla__container h-[700px] items-center m-0">
			<div class="embla__slide h-full">
				<div
					class="bg-center bg-no-repeat bg-cover grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 p-14 h-full items-center relative"
					style="background-image: url(/background.png)"
				>
					<div
						class="absolute bg-opacity-50 w-full h-full {$modeCurrent ? 'bg-white' : 'bg-black'}"
					/>
					<div class="lg:order-2 w-2/3 mx-auto relative">
						<div class="aspect-video">
							<Components />
						</div>
					</div>
					<div
						class="flex flex-col lg:order-1 items-center lg:items-start text-center lg:text-left space-y-4 relative"
					>
						<h1 class="!text-3xl lg:!text-5xl">Enter The Axone Universe</h1>
						<h3 class="!text-2xl lg:!text-3xl">A collaborative way of storytelling</h3>
						<p class="!text-l md:!text-xl">
							Collaborate with authors and illustrators to create stories with multiple storylines
						</p>
						<div class="flex gap-4">
							<a href="/login" class="btn variant-filled-primary"
								><span>Get Started</span> <i class="fa-solid fa-arrow-right-long" /></a
							> <a href="/learn" class="btn variant-soft-primary">Learn More</a>
						</div>
					</div>
				</div>
			</div>
			<div class="embla__slide h-full">
				<div
					class="bg-center bg-no-repeat bg-cover grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 p-14 h-full relative"
					style="background-image: url(/competition.png)"
				>
					<div
						class="absolute bg-opacity-20 w-full h-full {$modeCurrent ? 'bg-white' : 'bg-black'}"
					/>
				</div>
			</div>
			{#each campaigns as campaign}
				<div class="embla__slide h-full">
					<div
						class="bg-center bg-no-repeat bg-cover grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 items-center p-14 h-full relative"
						style="background-image: url(/competition_background.png)"
					>
						<div
							class="absolute bg-opacity-50 w-full h-full {$modeCurrent ? 'bg-white' : 'bg-black'}"
						/>
						<div class="flex flex-col w-full mx-auto items-center relative">
							<div class="aspect-[2/3] h-[400px]">
								<ImageWithFallback src={campaign.book.imageURL} alt={campaign.book.title} />
							</div>
						</div>
						<div
							class="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 relative"
						>
							<h3 class="!text-2xl lg:!text-3xl">{campaign.book.title}</h3>
							<p class="!text-l md:!text-xl line-clamp-3">
								{campaign.book.description}
							</p>
							<div class="flex flex-row gap-12 w-full">
								<div use:popup={infoPopup('datePopup')}>
									<button class="btn-icon variant-ghost p-2"
										><Icon scale={1.5} data={calendar} /></button
									>
									<div
										class="card p-4 flex-col md:flex-row justify-between gap-2 hidden"
										data-popup="datePopup"
									>
										<div class="space-y-4">
											<div class="flex flex-col items-center">
												<div class="chip rounded-full variant-filled">
													{formattedDate(
														new Date(
															typeof campaign.startDate === 'string' ? campaign.startDate : ''
														)
													)}
												</div>
												to
												<div class="chip rounded-full variant-filled">
													{formattedDate(
														new Date(typeof campaign.endDate === 'string' ? campaign.endDate : '')
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
								<div use:popup={infoPopup('criteriaPopup')}>
									<button class="btn-icon variant-ghost p-2"
										><Icon scale={1.5} data={checkCircle} /></button
									>
									<div
										class="card p-4 flex-col md:flex-row justify-between gap-2 hidden"
										data-popup="criteriaPopup"
									>
										<div class="space-y-4 w-72">
											<div class="flex flex-col items-center">
												{campaign.submissionCriteria}
											</div>
										</div>
									</div>
								</div>

								<div use:popup={infoPopup('rewardsPopup')}>
									<button class="btn-icon variant-ghost p-2"
										><Icon scale={1.5} data={trophy} /></button
									>
									<div
										class="card p-4 flex-col md:flex-row justify-between gap-2 hidden"
										data-popup="rewardsPopup"
									>
										<div class="space-y-4 w-72">
											<div class="flex flex-col items-center">
												{campaign.rewards}
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class="flex gap-4">
								<a href="/book/{campaign.book._id}" class="btn variant-filled-primary"
									><span>Enter Now</span> <i class="fa-solid fa-arrow-right-long" /></a
								>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<div class="embla__controls flex flex-row w-full items-centern justify-center">
			<div class="embla__dot m-4 flex flex-row w-fit items-center">
				{#each { length: campaigns.length + 2 } as _, i}
					<button
						on:click={() => {
							selectSlide(i);
						}}
						><Icon
							class="btn-icon top-0 cursor-pointer icon-info  {i === selectedIndex
								? '!fill-primary-400'
								: ''}"
							data={dotCircleO}
							scale={1.5}
							style="color:white"
						/></button
					>
				{/each}
			</div>
		</div>
	</div>
</Section>

<Section class="flex items-center">
	<Container>
		<div class="text-center max-w-[700px] p-8">
			<p class="tracking-wide leading-8">
				<i
					>"Great discoveries and improvements invariably involve the cooperation of many minds. I
					may be given credit for having blazed the trail, but when I look at the subsequent
					developments I feel the credit is due to others rather than to myself." - <b
						>Alexandar Graham Bell</b
					></i
				>
			</p>
		</div>
	</Container>
</Section>

<Section class="bg-surface-100-800-token flex items-center">
	<Container>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 items-center">
			<div class="w-full max-w-[400px] mx-auto">
				<div class="relative">
					<Author_3 />
				</div>
			</div>
			<div
				class="flex flex-col items-center text-center lg:text-start lg:items-start space-y-4 lg:space-y-10 max-w-[640px]"
			>
				<div class="mx-auto space-y-4">
					<h3 class="!text-3xl lg:!text-3xl">Publish Your Story</h3>
					<p>
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
				<div class="mx-auto space-y-4">
					<h3 class="!text-3xl md:!text-3xl">Overcome The Writer's Block</h3>
					<p>
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
				<div class="mx-auto space-y-4">
					<h3 class="!text-3xl md:!text-3xl">Bring Your Story To Life</h3>
					<p>
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

<Section class="bg-surface-50-900-token">
	<Container>
		<DocumentCarousel
			on:selectedStoryline={() => {}}
			documentType="User"
			viewPort="w-[90%] md:w-[25%]"
			documents={[
				{
					_id: '',
					firstName: 'Laeeq',
					lastName: 'Orrie',
					labels: ['Writer'],
					imageURL:
						'https://ejrsceonrzysmcheplfg.supabase.co/storage/v1/object/public/profiles/6a95394a-fd2f-4137-b7e4-4c6c42d8d753/profile.jpg',
					about:
						'"Using Axone has been a delightful experience. The platform fosters collaboration on literary pieces, allowing me to learn from others and grow as a writer. The process was both enjoyable and enriching, providing a vibrant space for creativity and connection."'
				},
				{
					_id: '',
					firstName: 'Luke',
					lastName: 'Ryan',
					labels: ['Writer'],
					imageURL:
						'https://ejrsceonrzysmcheplfg.supabase.co/storage/v1/object/public/profiles/1dcad11b-0ee0-4aca-92c1-8e5a195952d6/profile.jpg',
					about:
						'"When I first joined Axone, I quickly realized how much richer my storytelling became through collaboration. Working with others brings so many new ideas to the table—ideas that I would have never come up with on my own. It\'s amazing how a single concept can transform as different people contribute their perspectives, adding layers and depth to the plot and characters. The flow of creativity becomes so much more natural, and it’s like watching your story evolve in ways that feel unexpected yet perfect. What I love most is how the process feels less like a lonely task and more like an exciting group adventure. Every new chapter, every new storyline idea, brings the work forward in ways I couldn\'t have imagined alone. It’s easier to push past writer’s block when there’s a team of talented individuals supporting each other. And the best part? The energy in the creative process keeps everything moving smoothly. It’s a space where ideas flow freely, and the story grows into something truly special."'
				},
				{
					_id: '',
					firstName: 'Si-Jia',
					lastName: 'Wu',
					labels: ['Writer'],
					imageURL:
						'https://ejrsceonrzysmcheplfg.supabase.co/storage/v1/object/public/profiles/ffd875b3-02ce-4ab3-b3b2-9d2ff6979356/profile.png',
					about:
						'"I stumbled upon the Axone Universe Collaborative Writing Competition by chance and was thrilled to participate, grateful that I can share my writing with a broader audience. Although winning was an unexpected honor, I am ecstatic with the success. This experience has reinforced my love for storytelling."'
				},
				{
					_id: '',
					firstName: 'Illiana',
					lastName: 'Norgard',
					labels: ['Writer'],
					about:
						'"I stumbled upon the Axone Universe Collaborative Writing Competition by chance and was thrilled to participate, grateful that I can share my writing with a broader audience. Although winning was an unexpected honor, I am ecstatic with the success. This experience has reinforced my love for storytelling."'
				}
			]}
		/>
	</Container>
</Section>
