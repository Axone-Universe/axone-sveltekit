// src/routes/api/comments/[id]/+server.js
import { ResourcesRepository } from '$lib/repositories/resourcesRepository';
import { Xls20D } from '$lib/types/xls-20d.d';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
	const { id } = params;

	const resourcesRepo = new ResourcesRepository();
	const resource = await resourcesRepo.getById(null, id);

	if (resource) {
		const attributes = resource.properties?.map((property) => {
			return { trait_type: property.name, value: property.value };
		});

		const tokenData: Xls20D = {
			...{
				schema: 'ipfs://QmNpi8rcXEkohca8iXu7zysKKSJYqCvBJn3xJwga8jXqWU',
				nftType: 'art.v0',
				name: resource.title ?? '',
				description: resource.description ?? '',
				image: resource.src ?? '',
				license: resource.license ?? 'None',
				attributes: attributes
			},
			...(resource.nftCollection ? { collection: { name: resource.nftCollection! } } : {})
		};

		return json(tokenData);
	} else {
		return new Response('Comment not found', { status: 404 });
	}
}
