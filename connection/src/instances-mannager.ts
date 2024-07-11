import axios from "axios";

export interface ClientParameters {
    message: string,
    data: {
        name: string,
        server: {
            host: string,
            port: number,
            username: string,
            password: string,
            database: string
        },
        parameters?: {
            client_name: "exatron",
            parameters: Record<string, any>;
        }
    }
}

export class InstancesMannager {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public async executeQuery<T>(
        clientName: string,
        query: string,
        parameters: Array<any>
    ): Promise<{ result: T }> {
        return new Promise(async (res, rej) => {
            const requestUrl = this.baseUrl + `/api/instances/${clientName}/query`;
            const requestBody = { query, parameters }

            await axios.post<{ result: T }>(requestUrl, requestBody)
                .then((response) => {
                    res(response.data);
                })
                .catch((err) => {
                    rej(err.response ? err.response.data : err["errors"]);
                });
        });
    }

    public async getParameters(clientName: string) {
        return new Promise<ClientParameters>(async (res, rej) => {
            const requestUrl = this.baseUrl + `/api/instances/${clientName}/parameters`;

            await axios.get<ClientParameters>(requestUrl)
                .then((response) => {
                    res(response.data);
                })
                .catch((err) => {
                    rej(err.response ? err.response.data : err["errors"]);
                });
        });
    }
}