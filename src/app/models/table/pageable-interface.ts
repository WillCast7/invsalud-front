export interface PageableInterface<T> {
    empty: boolean;
    first: boolean;
    last: boolean;
    number: number;
    numberOfElements: number;
    pageable: {
        offset: number;
        pageNumber: number;
        pageSize: number;
        paged: boolean;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        }
        unsorted: boolean;
    }
    size: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    }
    totalElements: number;
    totalPages: number;
    content: T[];
    
}

export const PageableInitializer: PageableInterface<any> = {
    empty: true,
    first: true,
    last: true,
    number: 0,
    numberOfElements: 0,
    pageable: {
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        sort: {
            empty: true,
            sorted: false,
            unsorted: true
        },
        unsorted: true
    },
    size: 10,
    sort: {
        empty: true,
        sorted: false,
        unsorted: true
    },
    totalElements: 0,
    totalPages: 0,
    content: []
}; 
