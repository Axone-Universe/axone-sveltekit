import { XUMM_APIKEY } from '$env/static/private';
import { XUMM_APISECRET } from '$env/static/private';
import { SdkTypes, XummSdk } from 'xumm-sdk';

export class CustomXummSdk extends XummSdk {
	constructor(apiKey?: string, apiSecret?: string) {
		super(apiKey, apiSecret);
	}

	async getRates(currencyCode: string): Promise<SdkTypes.RatesResponse> {
		if (currencyCode === 'XRP') {
			const usdRates = await super.getRates('USD');
			usdRates.USD = 1 / usdRates.XRP;
			usdRates.XRP = 1;

			return usdRates;
		}
		return super.getRates(currencyCode);
	}
}

export const xummSdk = new CustomXummSdk(XUMM_APIKEY, XUMM_APISECRET);
