class Database {
    private static instances: Map<string, Database> = new Map();
    private static pool: Map<string, any> = new Map();
    private tableName: string;

    private constructor(tableName: string) {
        this.tableName = tableName;
    }

    public static getInstance(tableName: string): Database {
        if (!Database.instances.has(tableName)) {
            Database.instances.set(tableName, new Database(tableName));
            Database.pool.set(tableName, new Map());
        }

        return Database.instances.get(tableName)!;
    }

    public async set(key: string, value: any): Promise<void> {
        Database.pool.get(this.tableName)!.set(key, value);
    }

    public async get(key: string): Promise<any> {
        return Database.pool.get(this.tableName)!.get(key) || null;
    }

    public async has(key: string): Promise<boolean> {
        return Database.pool.get(this.tableName)!.has(key);
    }

    public async delete(key: string): Promise<void> {
        Database.pool.get(this.tableName)!.delete(key);
    }

    public async allKeys(): Promise<string[]> {
        return Database.pool.get(this.tableName)!.keys();
    }

    public async all(): Promise<{ key: string; value: any }[]> {
        const result: { key: string; value: any }[] = [];
        for (const [key, value] of Database.pool.get(this.tableName).entries()) {
            result.push({ key, value });
        }
        return result;
    }

    public async keys(): Promise<string[]> {
        return Array.from(Database.pool.get(this.tableName).keys());
    }

    public async values(): Promise<any[]> {
        return Array.from(Database.pool.get(this.tableName).values());
    }
}

export default Database;
