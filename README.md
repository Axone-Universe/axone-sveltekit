# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Testing

### Running Tests

To run the tests:
```bash
npm test
```
To view console logs you must put empty lines under the log you want to view:
```javascript
console.log("Please show this log")
console.log("\n")
```

### Neo4j local Setup

To use a local neo4j instance follow the steps below:

- Download the desktop version of neo4j.
- Create a new project, then a new DBMS.
- You then must start the DBMS and it will give an option to add a DB.
  - Create a DB
- Set auth to disabled for testing purposes.
  - On the DBMS menu click on settings.
  - Then set dbms.security.auth_enabled=false
- To add an admin, open neo4j browser through the desktop admin.
- Then on the left-hand menu on the databases tab, change DB to 'system'
- Then run this query:
```
CALL dbms.security.createUser('axone-admin', 'password');
CALL dbms.security.addRoleToUser('admin', 'axone-admin');
```
- To test, start a DBMS and use 'bolt://localhost:7687' as the url
  - The password and db-user can be left blank because authentication is diabled

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
