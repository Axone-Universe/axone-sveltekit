import { test, expect } from "vitest";
import { setup, $fetch } from 'vite-test-utils'

await setup({
    server: true,
    mode: 'dev'
})

test('create book', async () => {

    const response = await $fetch("/api/books/create", {
        method: "POST",
        body: JSON.stringify({
            title: "Harry Potter And The Socerer's Stone",
            summary: "Setting the body property"
        }),
        headers: {
            accept: "application/json"
        }
    })

    console.log(" yeah here")
    expect(response['data']['title']).toEqual("Harry Potter And The Socerer's Stone")
})