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

Install docker desktop first for your machine https://docs.docker.com/engine/install/

Run the MongoDB server through docker-compose.

```bash
sudo docker-compose up -d
```

To stop the container run

```bash
sudo docker-compose stop
```

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

To populate UI testing data run:

```bash
pnpm test-data
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

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
