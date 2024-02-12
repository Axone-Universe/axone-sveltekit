import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageBucketError } from '../types';
import type { StorageError } from '@supabase/storage-js';
import imageCompression from 'browser-image-compression';

export async function uploadImage(
	client: SupabaseClient,
	bucket: string,
	imageFile: File
): Promise<{
	url: string | null;
	error: null | StorageError;
}> {
	const compressedImage = await compressImage(imageFile);
	imageFile = compressedImage ?? imageFile;

	await createBucket({
		supabase: client,
		bucket: bucket
	});

	const response = await client.storage
		.from(bucket)
		.upload(imageFile.name, imageFile, { upsert: true });

	if (response.data) {
		const urlData = client.storage.from(bucket).getPublicUrl(response.data.path);
		console.log('** url data ');
		console.log(urlData);
		return { url: urlData.data.publicUrl, error: null };
	} else if ((response.error as any).statusCode === '409') {
		const urlData = client.storage.from(bucket).getPublicUrl(imageFile.name);
		console.log('** url data ');
		console.log(urlData);
		return { url: urlData.data.publicUrl, error: null };
	}

	return { url: null, error: response.error };
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
