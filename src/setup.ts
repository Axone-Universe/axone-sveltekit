import { neo4jDriver } from '$lib/db/driver';

beforeAll(() => {
	cleanup();
});

async function cleanup() {
	console.log('Cleaning up database...');

	const session = neo4jDriver.session({ database: 'neo4j' });

	const cypher = 'MATCH (n) DETACH DELETE n';

	try {
		await session.executeWrite((tx) => tx.run(cypher));
	} finally {
		session.close();
	}

	console.log('Database cleaned.');
}
