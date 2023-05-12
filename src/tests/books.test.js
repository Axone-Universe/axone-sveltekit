import { test, expect, beforeAll } from "vitest";
import { setup, $fetch } from 'vite-test-utils'
import neo4j from 'neo4j-driver';

await setup({
    server: true,
    mode: 'dev'
})

beforeAll(() => {
    cleanup()
});

async function cleanup() {

    let driver =
        neo4j.driver(
            import.meta.env.VITE_AURA_URL,
            neo4j.auth.basic
                (
                    import.meta.env.VITE_AURA_USER,
                    import.meta.env.VITE_AURA_PASSWORD
                )
        );

    const session = driver.session({ database: 'neo4j' });

    let cypher = 'MATCH (n) DETACH DELETE n'

    await session.executeWrite(tx =>
        tx.run(cypher)
    )
}

test('create book', async () => {

    // create a user first
    const userResponse = await $fetch("/api/users/create", {
        method: "POST",
        body: JSON.stringify({
            name: "User 1",
            email: "user1@example.com"
        }),
        headers: {
            accept: "application/json"
        }
    })

    let userId = userResponse['data']['id']

    const bookResponse = await $fetch("/api/books/create", {
        method: "POST",
        body: JSON.stringify({
            title: "Harry Potter And The Socerer's Stone",
            summary: "Setting the body property"
        }),
        headers: {
            accept: "application/json",
            userId: userId
        }
    })

    console.log(" yeah here")
    expect(bookResponse['data']['title']).toEqual("Harry Potter And The Socerer's Stone")
})

test('get book', async () => {

    const bookResponse = await $fetch("/api/books/get", {
        method: "GET",
        headers: {
            accept: "application/json"
        }
    })

    expect(bookResponse['data'][0]['title']).toEqual("Harry Potter And The Socerer's Stone")
})