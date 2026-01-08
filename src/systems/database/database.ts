import { Pool } from "pg";

const pool = new Pool({
    user: process.env.PG_USER || "postgres",
    host: process.env.PG_HOST || "localhost",
    database: process.env.PG_DATABASE || "my_database",
    password: process.env.PG_PASSWORD || "password",
    port: parseInt(process.env.PG_PORT || "5432"),
});

class Database {
    private static instances: Map<string, Database> = new Map();
    private tableName: string;

    private constructor(tableName: string) {
        this.tableName = tableName;
        this.initializeTable();
    }

    public static getInstance(tableName: 'profiles' | 'brainrots' | 'shop' | 'decks'): Database {
        if (!Database.instances.has(tableName)) {
            Database.instances.set(tableName, new Database(tableName));
        }

        return Database.instances.get(tableName)!;
    }

    private async initializeTable(): Promise<void> {
        const query = `
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                key TEXT PRIMARY KEY,
                value JSONB NOT NULL
            );
        `;
        await pool.query(query);
    }

    public async set(key: string, value: any): Promise<void> {
        value = JSON.stringify(value);

        const query = `
            INSERT INTO ${this.tableName} (key, value)
            VALUES ($1, $2)
            ON CONFLICT (key) DO UPDATE SET value = $2;
        `;
        await pool.query(query, [key, value]);
    }

    public async get(key: string): Promise<any> {
        const query = `
            SELECT value FROM ${this.tableName} WHERE key = $1;
        `;
        const result = await pool.query(query, [key]);
        return result.rows[0]?.value || null;
    }

    public async has(key: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM ${this.tableName} WHERE key = $1;
        `;
        const result = await pool.query(query, [key]);

        if (!result.rowCount) return false;

        return result.rowCount > 0;
    }

    public async delete(key: string): Promise<void> {
        const query = `
            DELETE FROM ${this.tableName} WHERE key = $1;
        `;
        await pool.query(query, [key]);
    }

    public async allKeys(): Promise<string[]> {
        const query = `
            SELECT key FROM ${this.tableName};
        `;
        const result = await pool.query(query);
        return result.rows.map(row => row.key);
    }

    public async all(): Promise<{ key: string; value: any }[]> {
        const query = `
            SELECT key, value FROM ${this.tableName};
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    public async keys(): Promise<string[]> {
        const query = `
            SELECT key FROM ${this.tableName};
        `;
        const result = await pool.query(query);
        return result.rows.map(row => row.key);
    }

    public async values(): Promise<any[]> {
        const query = `
            SELECT value FROM ${this.tableName};
        `;
        const result = await pool.query(query);
        return result.rows.map(row => row.value);
    }
}

export default Database;
