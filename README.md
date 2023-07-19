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

## MongoDB local setup

To use a local mongodb instance follow the steps below:

### Mac

On Mac use homebrew. If not installed install it.

Add the mongodb repo to homebrew

```bash
brew tap mongodb/brew
```

Install community mongodb

```bash
brew install mongodb-community@6.0
```

We use transactions for DB consistency. For this a mongodb replica set is required
To use replica sets install the package run-rs globally

```bash
npm i -g run-rs
```

In a separate terminal run

```bash
sudo run-rs --mongod --dbpath ./rs-data
```

## Testing

### Running Tests

To run the tests:

```bash
npm test
```

To run a certain fixture:

```bash
pnpm vitest chapters
```

To view console logs you must put empty lines under the log you want to view:

```javascript
console.log('Please show this log');
console.log('\n');
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
