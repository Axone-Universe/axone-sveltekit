import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageBucketError } from '../types';
import type { StorageError } from '@supabase/storage-js';
import imageCompression from 'browser-image-compression';
import type { ToastSettings } from '@skeletonlabs/skeleton';

export async function uploadImage(
	client: SupabaseClient,
	bucket: string,
	imageFile: File,
	toastStore: any
): Promise<{
	url: string | null;
	error: null | StorageError;
}> {
	if (!imageFile) {
		return new Promise((resolve) => {
			resolve({ url: '', error: null });
		});
	}

	const t: ToastSettings = {
		message: 'Saving Image...',
		autohide: false
	};
	const toastId = toastStore.trigger(t);

	const compressedImage = await compressImage(imageFile);
	imageFile = compressedImage ?? imageFile;

	const result: {
		url: string | null;
		error: null | StorageError;
	} = { url: null, error: null };

	await createBucket({
		supabase: client,
		bucket: bucket
	});

	const response = await client.storage
		.from(bucket)
		.upload(imageFile.name, imageFile, { upsert: true });

	if (response.data) {
		const urlData = client.storage.from(bucket).getPublicUrl(response.data.path);
		result.url = urlData.data.publicUrl;
	} else if ((response.error as any).statusCode === '409') {
		const urlData = client.storage.from(bucket).getPublicUrl(imageFile.name);
		result.url = urlData.data.publicUrl;
	}

	toastStore.close(toastId);

	result.error = response.error;
	return result;
}

export async function compressImage(imageFile: File): Promise<File | undefined> {
	const options = {
		maxSizeMB: 1,
		useWebWorker: true
	};
	try {
		const compressedImage = await imageCompression(imageFile, options);

		return compressedImage;
	} catch (error) {
		console.log(error);
	}
}

export async function createBucket({
	supabase,
	bucket
}: {
	supabase: SupabaseClient;
	bucket: string;
}) {
	//check if bucket exists
	supabase.storage
		.getBucket(bucket)
		.then((response: StorageBucketError) => {
			if (response.error || !response.data) {
				// bucket not found, create bucket first
				return supabase.storage.createBucket(bucket, {
					public: false,
					allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg'],
					fileSizeLimit: 1024
				});
			}
		})
		.catch((error) => {
			console.log('** save bckt');
			console.log(error);
			throw new Error(error);
		});
}

export async function deleteBucket({
	supabase,
	bucket,
	path
}: {
	supabase: SupabaseClient;
	bucket: string;
	path: string;
}) {
	const { data: list } = await supabase.storage.from(bucket).list(path);
	const filesToRemove = list?.map((x) => `${path}/${x.name}`);

	console.log('** files to remove: ' + path);
	console.log(filesToRemove);

	if (filesToRemove) {
		await supabase.storage.from(bucket).remove(filesToRemove);
	}
}
