import { XUMM_APIKEY } from '$env/static/private';
import { XUMM_APISECRET } from '$env/static/private';
import { XummSdk } from 'xumm-sdk';

export const xummSdk = new XummSdk(XUMM_APIKEY, XUMM_APISECRET);
