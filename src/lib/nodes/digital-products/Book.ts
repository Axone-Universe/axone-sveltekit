import type { BookNode } from '../base/NodeTypes'
import type { BookProperties } from '../base/NodeProperties';
import type { INode } from '../base/INode'
import neo4j, { DateTime, Integer, int, Node, Relationship, type QueryResult } from 'neo4j-driver';
import type { Dict } from 'neo4j-driver-core/types/record'
import DBDriver from '../../db/DBDriver'
import stringifyObject from 'stringify-object'

export class Book implements BookNode, INode {
    identity: Integer;
    labels: string[] = ['Book']
    properties: BookProperties;
    elementId: string;

    constructor(properties: BookProperties) {
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

        const userId = this.properties.creator.id
        const properties = stringifyObject(this.properties, {
            filter: this.propertyFilter
        })

        console.log(properties)
        console.log("\n")

        let cypherLabels = this.labels.join(':')

        let cypher =
            `MATCH (user) WHERE user:User AND id(user)=${userId} 
            CREATE (book:${cypherLabels} ${properties})<-[:CREATED]-(user)
            SET book.id = toString(id(book))
            RETURN book{.*, creator: user{.*}} AS properties`

        return session.executeWrite(tx =>
            tx.run<T>(cypher)
        )
    }

    propertyFilter = (object: any, property: string) => {
        if (property === 'creator') {
            return false;
        }
        return true;
    }

    toString(): string {
        throw new Error('Method not implemented.');
    }
}