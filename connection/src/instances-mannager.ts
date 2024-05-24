import axios from "axios";

export class InstancesMannager {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public async executeQuery<T>(
        clientName: string,
        query: string,
        parameters: Array<any>
    ): Promise<{ result: Array<T> }> {
        return new Promise(async (res, rej) => {
            const requestUrl = this.baseUrl + `/api/${clientName}/query`;
            const requestBody = { query, parameters }

            await axios.post<{ result: Array<T> }>(requestUrl, requestBody)
                .then((response) => {
                    res(response.data);
                })
                .catch((err) => {
                    rej(err);
                });
        });
    }
}