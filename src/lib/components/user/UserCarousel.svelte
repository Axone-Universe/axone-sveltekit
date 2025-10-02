<script lang="ts">
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { chevronLeft, chevronRight } from 'svelte-awesome/icons';

	export let users: Array<{
		_id: string;
		firstName: string;
		lastName: string;
		labels: string[];
		imageURL: string;
		about: string;
	}>;

	let carouselContainer: HTMLDivElement;

	function scrollLeft(): void {
		let x = carouselContainer.scrollWidth;
		if (carouselContainer.scrollLeft !== 0)
			x = carouselContainer.scrollLeft - carouselContainer.clientWidth;
		carouselContainer.scroll({ left: x, behavior: 'smooth' });
	}

	function scrollRight(): void {
		let x = 0;
		if (
			carouselContainer.scrollLeft <
			carouselContainer.scrollWidth - carouselContainer.clientWidth - 1
		)
			x = carouselContainer.scrollLeft + carouselContainer.clientWidth;
		carouselContainer.scroll({ left: x, behavior: 'smooth' });
	}
</script>

<div class="space-y-8">
	<div class="text-center">
		<h2 class="text-3xl md:text-4xl font-bold mb-4">What Our Writers Say</h2>
		<p class="text-xl text-surface-600-300-token">Hear from the community of creators</p>
	</div>

	<!-- Testimonials Carousel -->
	<div class="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
		<!-- Button: Left -->
		<button
			type="button"
			on:click={scrollLeft}
			class="btn-icon variant-filled-primary"
			aria-label="Scroll left"
		>
			<Icon data={chevronLeft} scale={1.3} />
		</button>

		<!-- Carousel Container -->
		<div
			bind:this={carouselContainer}
			class="snap-x snap-mandatory scroll-smooth flex gap-3 overflow-x-auto scrollbar-hide"
		>
			{#each users as user}
				<div class="shrink-0 w-[45%] md:w-[30%] lg:w-[23%] snap-start">
					<a
						href="/profile/{user._id}"
						target="_blank"
						rel="noopener noreferrer"
						class="block w-full aspect-[2/3] relative"
					>
						<div
							class="card p-3 w-full h-full flex flex-col hover:variant-soft-primary transition-colors cursor-pointer overflow-hidden"
						>
							<!-- Author Info -->
							<div class="flex flex-col items-center text-center gap-2">
								{#if user.imageURL}
									<img
										src={user.imageURL}
										alt="{user.firstName} {user.lastName}"
										class="w-16 h-16 rounded-full object-cover"
									/>
								{:else}
									<div
										class="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold"
									>
										{user.firstName.charAt(0)}{user.lastName.charAt(0)}
									</div>
								{/if}
								<div>
									<h3 class="font-bold text-sm">
										{user.firstName}
										{user.lastName}
									</h3>
									<p class="text-xs text-surface-600-300-token">
										{user.labels.join(', ')}
									</p>
								</div>
							</div>

							<!-- Testimonial Text - Vertically Centered -->
							<div class="flex-1 flex items-center justify-center">
								<p
									class="text-sm text-surface-700-200-token italic leading-relaxed line-clamp-6 text-center px-2"
								>
									{user.about}
								</p>
							</div>
						</div>
					</a>
				</div>
			{/each}
		</div>

		<!-- Button: Right -->
		<button
			type="button"
			on:click={scrollRight}
			class="btn-icon variant-filled-primary"
			aria-label="Scroll right"
		>
			<Icon data={chevronRight} scale={1.3} />
		</button>
	</div>
</div>

<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
