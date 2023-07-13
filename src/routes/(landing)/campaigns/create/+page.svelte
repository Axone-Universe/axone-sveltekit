<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import type { CreateCampaign } from '$lib/util/types';
	import { InputChip, type ToastSettings, toastStore } from '@skeletonlabs/skeleton';
	import { format } from 'date-fns';
	import { Icon } from 'svelte-awesome';
	import { close as closeIcon } from 'svelte-awesome/icons';

	let currentStartDate: string;
	let currentEndDate: string;
	let currentDateEvent: string;

	const campaign: CreateCampaign = {
		title: '',
		organizer: { name: '', link: '' },
		dates: [],
		about: '',
		tags: [],
		bannerURL: '',
		previewText: '',
		rewards: '',
		submissionCriteria: ''
	};

	function addDate() {
		if (currentStartDate && currentEndDate && currentDateEvent) {
			campaign.dates = [
				...campaign.dates,
				{
					startDate: new Date(currentStartDate),
					endDate: new Date(currentEndDate),
					event: currentDateEvent
				}
			];
			currentStartDate = '';
			currentEndDate = '';
			currentDateEvent = '';
		}
	}

	function removeDate(i: number) {
		const temp = campaign.dates;
		temp.splice(i, 1);
		campaign.dates = temp;
	}

	async function createCampaign() {
		await trpc($page).campaigns.create.mutate(campaign);

		const t: ToastSettings = {
			message: 'Campaign created successfully',
			background: 'variant-filled-primary'
		};
		toastStore.trigger(t);

		await goto('/campaigns');
	}

	function addDefaultTestData() {
		campaign.title = 'Test Campaign';
		campaign.organizer = { name: 'Test Org', link: 'https://www.example.com' };
		campaign.bannerURL = 'https://source.unsplash.com/tS-jh0M6JoA/800x350';
		campaign.dates = [{ startDate: new Date(), endDate: new Date(), event: 'Test Event' }];
		campaign.previewText =
			"Unleash your imagination and join Hogwarts School of Witchcraft and Wizardry's thrilling creative writing campaign! Delve into the magical realms of storytelling, where pens and quills are your wands, and words have the power to transport readers to enchanting worlds.";
		campaign.rewards =
			"1. Grand Wizard's Quill: The overall winner will receive the prestigious Grand Wizard's Quill, a beautifully crafted enchanted quill that enhances writing abilities and brings out the best in every word.\n\n2. Magical Library Access: The top three finalists will be granted exclusive access to the restricted section of Hogwarts' library for a year. They will have the opportunity to delve into rare and ancient texts, unlocking hidden knowledge and expanding their imagination.\n\n3. Author's Apprenticeship: The most promising young writer will earn an apprenticeship with a renowned author from the wizarding world. They will receive personal mentorship, valuable insights, and guidance to refine their writing skills and develop their unique voice.\n\n4. Potion of Inspiration: Selected participants will be rewarded with a Potion of Inspiration, a magical elixir that fuels creativity and sparks new ideas. This potion will help them overcome writer's block and invigorate their imagination.\n\n5. Publication in the Daily Prophet: The top entries will be featured in a special edition of the Daily Prophet, granting recognition to talented writers and sharing their stories with the wider wizarding community.\n\n6. Hogwarts Literary Award: Each house will have a winner, and they will be honored with the Hogwarts Literary Award, receiving a commemorative trophy and eternal glory within the castle's hallowed halls.\n\nNote: All rewards are subject to Hogwarts' rules and regulations, and the campaign organizers reserve the right to modify or substitute rewards as necessary.";
		campaign.about =
			"Welcome to the enchanting world of words and imagination! The Hogwarts Creative Writing Campaign is a magical opportunity for witches, wizards, and magical beings of all ages to showcase their literary talents. Hosted within the hallowed halls of Hogwarts School of Witchcraft and Wizardry, this campaign aims to foster creativity, ignite the power of storytelling, and celebrate the written word.\n\nWhether you're a budding author, a seasoned wordsmith, or someone who simply loves to spin tales, this campaign welcomes all aspiring writers to weave their own literary spells. From fantastical adventures to heartwarming tales of friendship, the only limit is your imagination.\n\nParticipants are encouraged to submit their original works of fiction, poetry, or any other form of creative writing that transports readers to the enchanting realms of the wizarding world. Explore the hidden depths of Hogwarts, breathe life into magical creatures, or create your own fantastical landscapes. Let your pen be the wand that conjures captivating narratives and brings characters to life.\n\nA panel of esteemed judges, including renowned authors, Hogwarts professors, and literary experts, will carefully evaluate each entry based on creativity, storytelling prowess, originality, and mastery of the written word. The judges will be looking for works that captivate, inspire, and evoke the true spirit of the wizarding world.\n\nThe campaign offers a range of exciting rewards to honor the talent and dedication of the participants. From the coveted Grand Wizard's Quill, which enhances writing abilities, to access to the restricted section of Hogwarts' library for the top finalists, these rewards aim to encourage and nurture the winners' passion for writing.\n\nNot only will the winners gain recognition within the wizarding community, but their stories will also be featured in a special edition of the Daily Prophet, sharing their enchanting tales with readers far and wide.\n\nSo, summon your quills, unfurl parchment, and let your imagination take flight. Join us at Hogwarts for a literary adventure like no other. Embrace the magic of storytelling, weave words into spells, and create literary marvels that will enchant readers for generations to come. The Hogwarts Creative Writing Campaign eagerly awaits your entry, ready to celebrate the power and beauty of the written word in the enchanting realm of witchcraft and wizardry.\n\nNote: The Hogwarts Creative Writing Campaign is open to all magical beings, both students and non-students, with adherence to the rules and regulations set forth by the Hogwarts administration. The campaign organizers reserve the right to modify or update the guidelines and details as necessary.";
		campaign.submissionCriteria =
			'1. Originality: All submissions must be original works created by the participant. Plagiarized or previously published works will be disqualified.\n\n2. Theme: Entries should be set in the wizarding world and demonstrate a connection to the magical realm. Participants are encouraged to explore various themes, such as friendship, adventure, magic, or moral dilemmas, within the context of their stories.\n\n3. Word Count: Stories should have a minimum of 500 words and a maximum of 5,000 words. Poetry submissions should have a minimum of 10 lines and a maximum of 50 lines.\n\n4. Format: Entries must be submitted in written form, either as a typed document or legibly handwritten. All submissions should be in English.\n\n5. Age Categories: Participants will be divided into age categories for evaluation: Junior (11-14), Senior (15-17), and Adult (18 and above). Please indicate the appropriate age category when submitting your entry.';
		campaign.tags = ['Hogwarts', 'Magic'];
	}
</script>

<Container class="mx-4  md:mx-40 xl:mx-96">
	<div class="card p-4 space-y-4">
		<label>
			Campaign title
			<input class="input" type="text" bind:value={campaign.title} />
		</label>
		<div class="flex flex-col md:flex-row gap-2 w-full">
			<label class="grow">
				Organizer name
				<input class="input" type="text" bind:value={campaign.organizer.name} />
			</label>
			<label class="grow">
				Organizer link
				<input class="input" type="text" bind:value={campaign.organizer.link} />
			</label>
			<label class="grow">
				Banner Image URL
				<input class="input" type="text" bind:value={campaign.bannerURL} />
			</label>
		</div>
		<div class="flex flex-col md:flex-row gap-2 items-end">
			<div class="flex flex-col sm:flex-row w-full gap-2">
				<div class="grow">
					Start date
					<input
						class="input"
						type="date"
						id="startDate"
						name="startDate"
						bind:value={currentStartDate}
					/>
				</div>
				<div class="grow">
					End date
					<input
						class="input"
						type="date"
						id="endDate"
						name="endDate"
						bind:value={currentEndDate}
					/>
				</div>
			</div>
			<label class="w-full grow">
				Event name (e.g. Submission, Illustrations, etc.)
				<input class="input" type="text" bind:value={currentDateEvent} />
			</label>
			<button class="btn variant-filled-primary h-fit" on:click={addDate}>Add dates</button>
		</div>
		<div class="flex gap-2">
			{#each campaign.dates as date, i}
				<button class="chip variant-filled flex items-center gap-1" on:click={() => removeDate(i)}>
					<p>
						{`${date.event}: ${format(new Date(date.startDate), 'd MMM y')} - ${format(
							new Date(date.endDate),
							'd MMM y'
						)}`}
					</p>
					<Icon data={closeIcon} />
				</button>
			{/each}
		</div>
		<label>
			About
			<textarea class="textarea" bind:value={campaign.about} />
		</label>
		<label>
			Preview text
			<textarea class="textarea" bind:value={campaign.previewText} />
		</label>
		<label>
			Rewards
			<textarea class="textarea" bind:value={campaign.rewards} />
		</label>
		<label>
			Submission criteria
			<textarea class="textarea" bind:value={campaign.submissionCriteria} />
		</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			Tags
			<InputChip bind:value={campaign.tags} name="tags" placeholder="Enter any value..." />
		</label>
		<div class="flex flex-col sm:flex-row gap-4">
			<a class="btn variant-filled-error" href="/campaigns">Cancel</a>
			<button class="btn variant-filled" on:click={addDefaultTestData}>Add test data</button>
			<button class="btn variant-filled-primary" on:click={createCampaign}>Create campaign</button>
		</div>
	</div>
</Container>
