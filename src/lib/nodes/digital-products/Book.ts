import type Author from '../Author'
import type { BookNode } from '../base/NodeTypes'
import type { INode } from '../base/INode'
import neo4j, { DateTime, Integer, int, Node, Relationship, type QueryResult } from 'neo4j-driver';
import type { Dict } from 'neo4j-driver-core/types/record'
import DBDriver from '../../db/DBDriver'
import stringifyObject from 'stringify-object'

export class Book implements BookNode, INode {
    identity: Integer;
    labels: string[] = ['Book']
    properties: { title: string; };
    elementId: string;

    constructor(properties: { title: string; }) {
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

        let cypher = `CREATE (b:${cypherLabels} ${properties}) RETURN b{.*} as properties`

        return session.executeWrite(tx =>
            tx.run<T>(cypher)
        )
    }

    toString(): string {
        throw new Error('Method not implemented.');
    }
}