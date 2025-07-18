# create-svelte

## Running The Project

Clone this repository then run npm install

```bash
npm install
```

## Environment Variables

Setup the environmental variables by copying the .env-copy into a .env file

```bash
cp .env-copy .env
```

## MongoDB docker setup: Recommended

Install docker desktop first for your machine:
https://docs.docker.com/engine/install/

Run the MongoDB server through docker-compose.

```bash
sudo docker-compose up -d
```

To stop the container run

```bash
sudo docker-compose stop
```

You can install MongoDB Compass GUI to view DBs and Collections:
https://www.mongodb.com/try/download/compass

## MongoDB manual setup

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

To run tests first run the MongoDB server above

After that run the commands below

```bash
npm test
```

To populate UI testing data run the command below. It will populate a separate DB from the normal tests.

NB: You can fill data for your supabase user by filling the TEST_USER_ID, TEST_USER_FIRST_NAME and TEST_USER_LAST_NAME in the .env
The TEST_USER_ID is found by checking your DB after a normal login. It's easier to check with 'MongoDB Compass' installed.

```bash
pnpm test-data
```

NB: If you change the schema, re-run test-data AND restart the dev server

To run a certain fixture:

```bash
pnpm vitest chapters
```

To view console logs you must put empty lines under the log you want to view:

```javascript
console.log('Please show this log');
console.log('\n');
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
# use the --host flag to give the app an IP on your router's network
# this is needed by localtunnel
pnpm run dev --host
```

> NOTE: by default, the app will start on https://localhost. This is because it is needed when testing the `adobe express` book-cover creator

> NOTE: you can change this by editing the `vite.config.ts` file to `https:false`

### Webhooks

Xaman sends a callback to our webhooks after transaction events.

- To enable this for development mode run localtunnel using this command;

```bash
lt --port 5173 --subdomain axone
```

> NOTE: when using localtunnel make sure that your dev app is running on http://localhost not https://localhost

> NOTE: you can change this by editing the `vite.config.ts` file to `https:false`

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
