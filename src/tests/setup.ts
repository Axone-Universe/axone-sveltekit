import { expect, afterAll, beforeAll, afterEach } from 'vitest';
import DBDriver from '$lib/db/DBDriver'

beforeAll(() => {
    cleanup()
});

async function cleanup() {
    console.log("*** clearing!")
    console.log("\n\n")
    let driver = new DBDriver().getDriver()
    const session = driver.session({ database: 'neo4j' });

    let cypher = 'MATCH (n) DETACH DELETE n'

    let result = await session.executeWrite(tx =>
        tx.run(cypher)
    )
}