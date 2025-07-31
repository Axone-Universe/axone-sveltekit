import { PUBLIC_XRPL_SERVER } from '$env/static/public';
import { ResourceBuilder } from '$lib/documents/digital-assets/resource';
import { ResourceProperties } from '$lib/properties/resource';
import { HydratedDocument } from 'mongoose';
import { Client, NFTOffer, TransactionMetadata } from 'xrpl';
import { NFTokenMintMetadata } from 'xrpl/dist/npm/models/transactions/NFTokenMint';

export const xrplClient = new Client(PUBLIC_XRPL_SERVER);

export async function getNFTokenId(
	resource: HydratedDocument<ResourceProperties> | undefined,
	txId: string
) {
	if (resource && resource.nftId) {
		return resource.nftId;
	}

	const client = xrplClient;
	await client.connect();

	const txMeta = (
		await client.request({
			command: 'tx',
			transaction: txId,
			binary: false
		})
	).result.meta as NFTokenMintMetadata;

	const nftokenID = txMeta?.nftoken_id;

	await client.disconnect();

	// update the resource nft id
	if (resource && nftokenID) {
		const resourceBuilder = new ResourceBuilder(resource._id).nftId(nftokenID);
		await resourceBuilder.update();
	}

	return nftokenID;
}

export async function getNFTokenOfferId(nftId: string, amount: string) {
	const client = xrplClient;
	await client.connect();

	const nftOffers = (
		await client.request({
			command: 'nft_sell_offers',
			nft_id: nftId
		})
	).result.offers as NFTOffer[];

	const nftOffer = nftOffers.find((offer) => offer.amount === amount);
	const nftOfferId = nftOffer?.nft_offer_index;

	await client.disconnect();

	return nftOfferId;
}

export async function getNFTokenWalletAddress(txId: string) {
	const client = xrplClient;
	await client.connect();

	const response = await client.request({
		command: 'tx',
		transaction: txId,
		binary: false
	});

	const address = response.result.tx_json.Account;
	console.log('** NFT owner address: ', address);

	await client.disconnect();

	return address;
}
