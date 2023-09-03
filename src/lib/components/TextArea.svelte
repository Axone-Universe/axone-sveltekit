<script lang="ts">
	export let maxLength: number;
	export let placeholder: string = '';
	export let required: boolean = false;
	export let textContent: string | undefined;
	$: remaining = maxLength - (textContent ? textContent.length : 0);
</script>

<div>
	<textarea
		class="textarea"
		bind:value={textContent}
		maxlength={maxLength}
		{required}
		{placeholder}
	/>
	<div class="text-sm">Characters left: {remaining}</div>
</div>
