export interface PaginatedResponse<T> {
    data: T[],
    page: {
        current: number;
        next: boolean;
        previous: boolean;
    }
}

export default function toPaginated<T>(
    rows: Array<T>,
    page: number,
    perPage: number
): PaginatedResponse<T> {
    const data: T[] = (rows.length > perPage ? rows.slice(0, perPage) : rows) as T[];

    const paginatedResponse = {
        data,
        page: {
            current: page,
            next: rows.length > perPage,
            previous: page > 1
        }
    };

    return paginatedResponse;
}