import type { Dict } from 'neo4j-driver-core/types/record';
import { neo4jDriver } from '$lib/db/driver';
import type {QueryResult} from 'neo4j-driver';
import { AURA_DB } from '$env/static/private';

export class DBSession {

    async executeWrite<T extends Dict>(cypher:string): Promise<QueryResult<T>> {
        const session = neo4jDriver.session({ database: AURA_DB });
        
        const result = await session.executeWrite((tx) => tx.run<T>(cypher));

        session.close()

        return new Promise<QueryResult<T>>((resolve) => {
			resolve(result);
		});
    }

    async executeRead<T extends Dict>(cypher:string): Promise<QueryResult<T>> {
        const session = neo4jDriver.session({ database: AURA_DB });

        const result = await session.executeRead((tx) => tx.run<T>(cypher));

        session.close()

        return new Promise<QueryResult<T>>((resolve) => {
			resolve(result);
		});
    }

}