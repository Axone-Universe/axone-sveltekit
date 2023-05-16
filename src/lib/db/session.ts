import type { Dict } from 'neo4j-driver-core/types/record';
import { neo4jDriver } from '$lib/db/driver';
import type { QueryResult } from 'neo4j-driver';
import { AURA_DB } from '$env/static/private';

async function executeWrite<T extends Dict>(cypher: string): Promise<QueryResult<T>> {
	const session = neo4jDriver.session({ database: AURA_DB });
	let result: QueryResult<T>;

	try {
		result = await session.executeWrite((tx) => tx.run<T>(cypher));
	} finally {
		session.close();
	}

	return new Promise<QueryResult<T>>((resolve) => {
		resolve(result);
	});
}

async function executeRead<T extends Dict>(cypher: string): Promise<QueryResult<T>> {
	const session = neo4jDriver.session({ database: AURA_DB });
	let result: QueryResult<T>;

	try {
		result = await session.executeRead((tx) => tx.run<T>(cypher));
	} finally {
		session.close();
	}

	return new Promise<QueryResult<T>>((resolve) => {
		resolve(result);
	});
}

export const session = {
	executeWrite,
	executeRead
};
