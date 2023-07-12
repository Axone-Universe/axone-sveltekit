import { NEO4J_PASSWORD, NEO4J_URL, NEO4J_USER, NEO4J_ENCRYPTION } from '$env/static/private';
import { auth, driver } from 'neo4j-driver';

export const neo4jDriver = driver(NEO4J_URL, auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
	encrypted: NEO4J_ENCRYPTION === 'true' ? true : false
});
