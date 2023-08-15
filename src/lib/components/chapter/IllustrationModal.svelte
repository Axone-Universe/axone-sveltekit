<script lang="ts">

    import type {Illustration} from "$lib/util/editor/quill";
    import { FileButton } from '@skeletonlabs/skeleton';
    import { modalStore } from '@skeletonlabs/skeleton';


    export let illustration: Illustration;
    export let uploadClick: (file: File, illustration: Illustration) => void;

    function changeImage(event: Event){
        const inputElement = event.target as HTMLInputElement;
        const file = inputElement.files?.[0];

        if (!file) {
            return; // No file selected
        }

        const imageElement = document.getElementById(`modal-image`) as HTMLImageElement;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                imageElement.src = e.target.result as string;
            }
        };
        reader.readAsDataURL(file);

        uploadClick(file, illustration);
    }

</script>

<div class="rounded-[14px] bg-surface-700 p-4 max-w-[45%] max-h-[45%]">
    <main class="mb-4">
        <img
                id="modal-image"
                class="rounded-lg max-w-[100%] max-h-[100%]"
                src={illustration?.illustration?.src || ''}
                alt={illustration?.illustration?.alt || illustration?.illustration?.src || ''}
        >
    </main>
    <footer class="flex flex-row-reverse">
        <button class="btn btn-sm variant-filled ml-3" on:click={() => modalStore.close()}>
          close
        </button>
        <FileButton
                type="file"
                name={illustration.id}
                accept="image/png, image/jpeg, image/gif, image/svg"
                button="btn-icon btn-sm variant-ringed-primary"
                on:change={changeImage}>
            <img class="w-16 h-8 mb-2" src="/upload.svg" alt="upload">
        </FileButton>
    </footer>

</div>
<slot />

