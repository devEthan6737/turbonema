import fs from 'fs';
import path from 'path';

class MegaDB {
    private static instances: Map<string, MegaDB> = new Map();
    private filePath: string;
    private data: Record<string, any> = {};

    private constructor(tableName: string) {
        const dir = path.join(process.cwd(), 'jsons');

        if (!fs.existsSync(dir)) fs.mkdirSync(dir);

        this.filePath = path.join(dir, `${tableName}.json`);
        this.loadData();
    }

    public static getInstance(tableName: string): MegaDB {
        if (!MegaDB.instances.has(tableName)) MegaDB.instances.set(tableName, new MegaDB(tableName));

        return MegaDB.instances.get(tableName)!;
    }

    private loadData(): void {
        if (fs.existsSync(this.filePath)) {
            try {
                const content = fs.readFileSync(this.filePath, 'utf-8');
                this.data = JSON.parse(content);
            } catch (error) {
                console.error(`Error leyendo ${this.filePath}:`, error);
                this.data = {};
            }
        } else {
            this.saveData();
        }
    }

    private saveData(): void {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 4));
    }

    public set(clave: string, valor: any): void {
        this.data[clave] = valor;
        this.saveData();
    }

    public get(clave: string): any {
        return this.data[clave] || null;
    }

    public has(clave: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.data, clave);
    }

    public delete(clave: string): void {
        delete this.data[clave];
        this.saveData();
    }

    public datas(): Record<string, any> {
        return this.data;
    }

    public push(clave: string, elemento: any): void {
        if (!this.data[clave]) this.data[clave] = [];
        if (Array.isArray(this.data[clave])) {
            this.data[clave].push(elemento);
            this.saveData();
        }
    }

    public plus(clave: string, cantidad: number): void {
        const actual = this.get(clave) || 0;
        this.set(clave, actual + cantidad);
    }
}

export default MegaDB;