import type { Driver } from 'neo4j-driver/types/driver';
import { AURA_PASSWORD, AURA_URL, AURA_USER } from '$env/static/private';
import neo4j from 'neo4j-driver';

export default class DBDriver {

    private driver: Driver | undefined

    getDriver(): Driver {
        if (this.driver === undefined) {
            console.log("*** " + AURA_URL)
            this.driver = neo4j.driver(AURA_URL, neo4j.auth.basic(AURA_USER, AURA_PASSWORD));
        }
        return this.driver
    }
}