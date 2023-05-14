import { env } from '$env/dynamic/private';
import { auth, driver } from 'neo4j-driver';

export const neo4jDriver = driver(env.AURA_URL, auth.basic(env.AURA_USER, env.AURA_PASSWORD));
