import { createPool, Pool, Connection } from "mysql2/promise";

class ClientPool {
    public readonly name: string;
    public readonly pool: Pool;

    constructor(name: string, pool: Pool) {
        this.name = name;
        this.pool = pool;
    }
}

export class ConnectionMannager {
    private readonly baseUrl: string;
    private readonly pools: Array<ClientPool> = [];

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async createClientPool(clientName: string): Promise<ClientPool> {
        const { host, port, user, password, database } = await fetch(`${this.baseUrl}/api/${clientName}/server`).then(r => r.json());

        const pool = createPool({
            host, port, user, password, database,
            waitForConnections: true,
            connectionLimit: 50,
        });

        const clientPool = new ClientPool(clientName, pool);
        this.pools.push(clientPool);

        return clientPool;
    }

    private async getOrCreatePool(clientName: string): Promise<Pool> {
        const findPool = this.pools.find(p => p.name === clientName);

        if (!findPool) {
            const newPool = await this.createClientPool(clientName);

            return newPool.pool;
        }

        return findPool.pool;
    }

    public async getConnection(clientName: string): Promise<Connection> {
        const clientPool = await this.getOrCreatePool(clientName);

        return clientPool.getConnection();
    }
}