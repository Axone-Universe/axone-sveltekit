import { MONGO_PASSWORD, MONGO_URL, MONGO_USER, MONGO_DB } from '$env/static/private';
import mongoose from 'mongoose';

const options: mongoose.ConnectOptions = {
	dbName: MONGO_DB,
	user: MONGO_USER,
	pass: MONGO_PASSWORD
};

export async function startMongo() {
	await mongoose.connect(MONGO_URL, options);
}
