import { XUMM_APIKEY, XUMM_APISECRET } from '$env/static/private';
import { type SdkTypes, XummSdk } from 'xumm-sdk';

export class CustomXummSdk extends XummSdk {
	constructor(apiKey?: string, apiSecret?: string) {
		super(apiKey, apiSecret);
	}

	async getRates(currencyCode: string): Promise<SdkTypes.RatesResponse> {
		return super.getRates(currencyCode);
	}
}

export const xummSdk =
	process.env.NODE_ENV === 'test' ? undefined : new CustomXummSdk(XUMM_APIKEY, XUMM_APISECRET);
