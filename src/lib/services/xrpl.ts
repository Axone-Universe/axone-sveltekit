import { PUBLIC_XRPL_SERVER } from '$env/static/public';
import { Client, NFTOffer } from 'xrpl';
import { NFTokenOffer } from 'xrpl/dist/npm/models/ledger';
import { NFTokenMintMetadata } from 'xrpl/dist/npm/models/transactions/NFTokenMint';

export const xrplClient = new Client(PUBLIC_XRPL_SERVER);

export async function getNFTokenIDFromTxId(txId: string) {
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
	console.log('** nft id');
	console.log(nftokenID);
	console.log(txMeta);
	await client.disconnect();

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

	console.log('** nft offer');
	console.log(nftOffers);
	console.log(nftOfferId);

	await client.disconnect();

	return nftOfferId;
}
