<script lang="ts">
	import {
		Avatar,
		ProgressRadial,
		RadioGroup,
		RadioItem,
		SlideToggle,
		LightSwitch
	} from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { pencil } from 'svelte-awesome/icons';

	// Local
	let value = 0;
	let demoSlideToggle = true;
</script>

<!-- variant-ringed-error -->
<div class="aspect-video relative">
	<!-- Avatar -->
	<div class="anim-float-avatar absolute z-[1] top-[15%] left-[25%] sm:top-[32%] sm:left-[40%]">
		<Avatar src="./brown-books.jpeg" width="w-32" shadow="shadow-xl" />
	</div>
	<!-- Editing -->
	<div
		class="hidden sm:block anim-float-progress anim-delay-200 absolute z-[1] top-[15%] left-[25%]"
	>
		<button class="btn variant-soft-primary">
			<span>Editing</span>
		</button>
	</div>
	<div class="hidden sm:block anim-float-card absolute z-[1] top-[5%] left-[15%]">
		<Avatar background="bg-surface-50" class="p-2" src="./type.png" width="w-20" />
	</div>
	<!-- Inspiring  -->
	<div class="hidden sm:block anim-float-search anim-delay-200 absolute z-[1] top-[5%] left-[70%]">
		<button class="btn variant-soft-primary">
			<span>Inspiring</span>
			<i class="fa-solid fa-spa" />
		</button>
	</div>
	<div class="hidden sm:block anim-float-card absolute z-[1] top-[-12%] left-[60%]">
		<Avatar background="bg-surface-50" class="p-2" src="./write.png" width="w-20" />
	</div>
	<!-- Engaging -->
	<div class="hidden sm:block anim-float-radio absolute z-[1] top-[70%] left-[75%]">
		<button class="btn variant-soft-primary">
			<span>Engaging</span>
			<i class="fa-solid fa-spa" />
		</button>
	</div>
	<div class="hidden sm:block anim-float-card absolute z-[1] top-[60%] left-[65%]">
		<Avatar background="bg-surface-50" class="p-2" src="./read.png" width="w-20" />
	</div>

	<!-- Collaborate -->
	<div class="hidden sm:block anim-float-button absolute z-[1] top-[120%] left-[55%]">
		<button class="btn variant-soft-primary">
			<span>Collaborative</span>
		</button>
	</div>
	<div
		class="hidden sm:block anim-float-light-switch anim-delay-200 absolute z-[1] top-[98%] left-[45%]"
	>
		<Avatar background="bg-surface-50" src="./collaborate.png" width="w-20" />
	</div>

	<!-- Illustrate -->
	<div class="hidden sm:block anim-float-button absolute z-[1] top-[78%] left-[15%]">
		<button class="btn variant-soft-primary">
			<span>Illustrative</span>
		</button>
	</div>
	<div class="hidden sm:block anim-float-toggle anim-delay-200 absolute z-[1] top-[55%] left-[5%]">
		<Avatar background="bg-surface-50" src="./draw.png" width="w-20" />
	</div>

	<!-- BG Circles -->
	<div class="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] z-0">
		<div
			class="w-96 aspect-square border-2 border-black/5 dark:border-white/5 rounded-full flex justify-center items-center"
		>
			<div
				class="w-[240px] aspect-square border-2 border-black/5 dark:border-white/5 rounded-full flex justify-center items-center"
			/>
		</div>
	</div>
</div>

<style lang="postcss">
	.anim-float-avatar {
		animation: float-up 13s ease-in-out infinite;
	}
	.anim-float-progress {
		animation: float-down 15s ease-in-out infinite;
	}
	.anim-float-search {
		animation: float-up 14s ease-in-out infinite;
		animation-delay: 3s;
	}
	.anim-float-radio {
		animation: float-down 17s ease-in-out infinite;
	}
	.anim-float-card {
		animation: float-up 12s ease-in-out infinite;
	}
	.anim-float-light-switch {
		animation: float-down 18s ease-in-out infinite;
		animation-delay: 2s;
	}
	.anim-float-button {
		animation: float-up 15s ease-in-out infinite;
	}
	.anim-float-toggle {
		animation: float-down 13s ease-in-out infinite;
		animation-delay: 5s;
	}
	.anim-float-badge {
		animation: float-up 15s ease-in-out infinite;
	}
	/* prettier-ignore */
	@keyframes float-up {
		0% { transform: translateY(0px); }
		50% { transform: translateY(-20px); }
		100% { transform: translateY(0px); }
	}
	/* prettier-ignore */
	@keyframes float-down {
		0% { transform: translateY(0px); }
		50% { transform: translateY(20px); }
		100% { transform: translateY(0px); }
	}
</style>
