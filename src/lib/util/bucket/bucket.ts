import type { SupabaseClient } from '@supabase/supabase-js';

export async function uploadBookCover(client: SupabaseClient, imageFile: File): Promise<string> {
	const response = await client.storage.from('book-covers').upload(imageFile.name, imageFile);

	console.log(response.error);

	if (response.data) {
		const urlData = client.storage.from('book-covers').getPublicUrl(response.data.path);
		return urlData.data.publicUrl;
	} else if ((response.error as any).statusCode === '409') {
		const urlData = client.storage.from('book-covers').getPublicUrl(imageFile.name);
		return urlData.data.publicUrl;
	}

	return '';
}
