import { User } from '$lib/models/user';
import { AXONE_ADMIN_EMAIL } from '$env/static/private';
import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from '$lib/properties/user';

let cachedAdminUser: HydratedDocument<UserProperties> | null = null;

/**
 * Gets the admin user object for use in database aggregate queries.
 * This ensures campaigns and other documents are retrieved with the correct permissions.
 * The admin user is cached to avoid repeated database queries.
 *
 * @returns The admin user document
 * @throws Error if admin user is not found
 */
export async function getAdminUser(): Promise<HydratedDocument<UserProperties>> {
	// Return cached admin user if available
	if (cachedAdminUser) {
		return cachedAdminUser;
	}

	// Fetch admin user from database
	const adminUser = await User.findOne({ email: AXONE_ADMIN_EMAIL }).exec();

	if (!adminUser) {
		throw new Error(`Admin user with email ${AXONE_ADMIN_EMAIL} not found`);
	}

	// Cache the admin user for future use
	cachedAdminUser = adminUser;

	return adminUser;
}

