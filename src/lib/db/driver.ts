import { AURA_PASSWORD, AURA_URL, AURA_USER } from '$env/static/private';
import { auth, driver } from 'neo4j-driver';

export const DRIVER = driver(AURA_URL, auth.basic(AURA_USER, AURA_PASSWORD));
