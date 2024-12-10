<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import Container from '$lib/components/Container.svelte';

	import Author_1 from '$lib/assets/author-1.svelte';
	import Author_2 from '$lib/assets/author-2.svelte';
	import Author_3 from '$lib/assets/author-3.svelte';
	import Author_4 from '$lib/assets/author-4.svelte';
	import Components from '$lib/components/hero/components.svelte';
	import type { SupabaseClient, Session } from '@supabase/supabase-js';
	import { goto } from '$app/navigation';
	import DocumentCarousel from '$lib/components/documents/DocumentCarousel.svelte';
	export let data: { supabase: SupabaseClient; session: Session | null };

	if (data.session) {
		goto('/home');
	}
</script>

<Section class="bg-surface-100-800-token flex items-center">
	<Container>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 items-center p-14">
			<div class="lg:order-2 w-full mx-auto">
				<div class="aspect-video relative">
					<Components />
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
					> <a href="/learn" class="btn variant-soft-primary">Learn More</a>
				</div>
			</div>
		</div>
	</Container>
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
