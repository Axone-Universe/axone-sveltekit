import type { UserNode } from './base/NodeTypes'
import type { UserProperties } from './base/NodeProperties';
import type { INode } from './base/INode'
import neo4j, { DateTime, Integer, int, Node, Relationship, type QueryResult } from 'neo4j-driver';
import type { Dict } from 'neo4j-driver-core/types/record'
import DBDriver from '$lib/db/DBDriver'
import stringifyObject from 'stringify-object'


export class Author implements UserNode, INode {
    identity: Integer;
    labels: string[] = ['User', 'Author']
    properties: UserProperties
    elementId: string;

    constructor(properties: UserProperties) {
        this.identity = int(0)
        this.properties = properties
        this.elementId = '0'
    }

    /**
     * Creates book AND creator nodes having the CREATED relationship.
     * This should be an atomic transaction because every book should have a creator.
     * @returns 
     */
    create<T extends Dict>(): Promise<QueryResult<T>> {
        let driver = new DBDriver().getDriver()
        const session = driver.session({ database: 'neo4j' });

        const properties = stringifyObject(this.properties);
        let cypherLabels = this.labels.join(':')

        let cypher = `CREATE (user:${cypherLabels} ${properties}) SET user.id = toString(id(user)) RETURN user{.*} as properties`

        return session.executeWrite(tx =>
            tx.run<T>(cypher)
        )
    }

    propertyFilter = (object: any, property: string) => { }

    toString(): string {
        throw new Error('Method not implemented.');
    }
}

