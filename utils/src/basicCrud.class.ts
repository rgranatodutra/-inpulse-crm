import { ResultSetHeader } from "mysql2";
import createWhereString, { FilterWithPaginationQueryParameters } from "./createWhereString.util";
import toPaginated, { PaginatedResponse } from "./toPaginated";
import { NotFoundError } from "@rgranatodutra/http-errors";

abstract class InstancesMannager {
    public abstract executeQuery<T>(clientName: string, query: string, parameters: Array<any>): Promise<{ result: T }>;
}

interface BasicCrudProps<T> {
    tableName: string,
    primaryKey: keyof T & string,
    likeColumns: Array<keyof T>,
    dateColumns: Array<keyof T>,
    numberColumns: Array<keyof T>,
    service: InstancesMannager,
}

class BasicCrud<T> {
    private readonly tableName: string;
    private readonly primaryKey: keyof T & string;
    private readonly likeColumns: Array<keyof T>;
    private readonly dateColumns: Array<keyof T>;
    private readonly numberColumns: Array<keyof T>;
    private readonly service: InstancesMannager;

    constructor(props: BasicCrudProps<T>) {
        this.tableName = props.tableName;
        this.primaryKey = props.primaryKey;
        this.likeColumns = props.likeColumns;
        this.dateColumns = props.dateColumns;
        this.numberColumns = props.numberColumns;
        this.service = props.service;
    }

    public async get(
        clientName: string,
        parameters: FilterWithPaginationQueryParameters<T>
    ): Promise<PaginatedResponse<T>> {
        const page = Number(parameters.page || 1);
        const perPage = Number(parameters.perPage || 20);

        const [whereString, queryParameters] = createWhereString<T>({
            parameters: parameters,
            likeColumns: this.likeColumns,
            dateColumns: this.dateColumns,
            numberColumns: this.numberColumns
        });

        const queryString = `SELECT * FROM ${this.tableName}\n${whereString}`;
        const queryResult = await this.service.executeQuery<Array<T>>(clientName, queryString, queryParameters)
            .then(data => data.result);

        const paginatedResult = toPaginated<T>(queryResult, page, perPage);

        return paginatedResult;
    }

    public async create<P extends Object>(
        clientName: string,
        payload: P,
    ) {
        const fields = `(${Object.keys(payload).join(", ")})`;
        const placeholders = `(${Object.entries(payload).map(_ => "?").join(", ")})`;
        const insertQueryParams = Object.values(payload);
        const isertQueryString = `INSERT INTO ${this.tableName} ${fields} VALUES ${placeholders}`;
        const insertQueryResult = await this.service.executeQuery<ResultSetHeader>(clientName, isertQueryString, insertQueryParams)
            .then(data => data.result);

        if (Object.keys(payload).includes(this.primaryKey)) {
            const searchQueryString = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
            const searchQueryResult = await this.service.executeQuery<Array<T>>(clientName, searchQueryString, [(payload as unknown as T)[this.primaryKey]])
                .then(data => data.result);

            return searchQueryResult[0];
        } else {
            const searchQueryString = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
            const searchQueryResult = await this.service.executeQuery<Array<T>>(clientName, searchQueryString, [insertQueryResult.insertId])
                .then(data => data.result);

            return searchQueryResult[0];
        }
    }

    public async update(
        clientName: string,
        id: any,
        payload: Partial<T>,
    ) {
        const findQueryString = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        const findQueryResult = await this.service.executeQuery<Array<T>>(clientName, findQueryString, [id])
            .then(data => data.result);

        if (findQueryResult.length <= 0) {
            throw new NotFoundError("entity not found");
        }

        const fields = Object.keys(payload).map(key => `${key} = ?`).join(", ");
        const values = Object.values(payload);
        const updateQueryString = `UPDATE  ${this.tableName} SET ${fields} WHERE ${this.primaryKey} = ?`;
        const updateQueryParams = [...values, id];
        await this.service.executeQuery<ResultSetHeader>(clientName, updateQueryString, updateQueryParams);

        const findUpdatedQueryResult = await this.service.executeQuery<Array<T>>(clientName, findQueryString, [id])
            .then(data => data.result);

        return findUpdatedQueryResult[0];
    }

    public async delete(
        clientName: string,
        id: any
    ) {
        const findQueryString = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        const findQueryResult = await this.service.executeQuery<Array<T>>(clientName, findQueryString, [id])
            .then(data => data.result);

        if (findQueryResult.length <= 0) {
            throw new NotFoundError("entity not found");
        }

        const deleteQueryString = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        await this.service.executeQuery<ResultSetHeader>(clientName, deleteQueryString, [id])
            .then(data => data.result);

        return;
    }
}

export default BasicCrud;