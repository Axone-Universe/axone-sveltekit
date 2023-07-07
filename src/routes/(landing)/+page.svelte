<script lang="ts">
	import type { EmblaOptionsType } from 'embla-carousel-svelte';

	import Section from '$lib/components/Section.svelte';
	import Container from '$lib/components/Container.svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import UserPreview from '$lib/components/user/UserPreview.svelte';

	import Author_1 from '$lib/assets/author-1.svelte';
	import Author_2 from '$lib/assets/author-2.svelte';
	import Author_3 from '$lib/assets/author-3.svelte';
	import Author_4 from '$lib/assets/author-4.svelte';

	import BookCarousel from '$lib/components/carousel/BookCarousel.svelte';

	let options: EmblaOptionsType = {
		loop: false,
		align: 'start',
		slidesToScroll: 1
	};
	let plugins: never[] = [];
</script>

<Section class="bg-surface-100-800-token flex items-center">
	<Container>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 items-center">
			<div class="lg:order-2 w-full mx-auto">
				<div class="aspect-video relative">
					<Author_2 />
				</div>
			</div>
			<div
				class="flex flex-col lg:order-1 items-center lg:items-start text-center lg:text-left space-y-4"
			>
				<h1 class="!text-3xl lg:!text-5xl">Enter The Axone Universe</h1>
				<h3 class="!text-2xl lg:!text-3xl">A collaborative way of storytelling</h3>
				<p class="!text-l md:!text-xl">
					Collaborate with authors and illustrators to create stories with multiple storylines
				</p>
				<div class="flex gap-4">
					<a href="/login" class="btn variant-filled-primary"
						><span>Get Started</span> <i class="fa-solid fa-arrow-right-long" /></a
					> <a href="/docs/introduction" class="btn variant-soft-primary">Learn More</a>
				</div>
			</div>
		</div>
	</Container>
</Section>

<Section class="bg-surface-50-900-token flex items-center">
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
					<a href="/docs/introduction" class="btn variant-soft-primary">Learn More</a>
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
					<a href="/docs/introduction" class="btn variant-soft-primary">Learn More</a>
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
					<a href="/docs/introduction" class="btn variant-soft-primary">Learn More</a>
				</div>
			</div>
		</div>
	</Container>
</Section>

<Section class="bg-surface-50-900-token">
	<Container>
		<BookCarousel {options} {plugins}>
			<UserPreview
				class="embla__slide"
				userData={{
					firstName: 'Takunda',
					lastName: 'Chirema',
					userWriterChecked: true,
					userEditorChecked: true,
					imageURL: 'https://source.unsplash.com/YOErFW8AfkI/128x128',
					about: '"Axone has allowed me to publish and monetize my unfinished book"'
				}}
			/>
			<UserPreview
				class="embla__slide"
				userData={{
					firstName: 'Lindi',
					lastName: 'Kers',
					userWriterChecked: true,
					userIllustratorChecked: true,
					imageURL: 'https://source.unsplash.com/YOErFW8AfkI/128x128',
					about:
						'"I have found inspiration for continuing my stories and my creativity has been awakened!"'
				}}
			/>
			<UserPreview
				class="embla__slide"
				userData={{
					firstName: 'Danae',
					lastName: 'Bouwer',
					userWriterChecked: true,
					imageURL: 'https://source.unsplash.com/YOErFW8AfkI/128x128',
					about:
						'"It is quite fun to explore the different authors, storylines and illustrations of artists. I love it!"'
				}}
			/>
		</BookCarousel>
	</Container>
</Section>
