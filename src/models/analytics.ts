export interface IApplication {
    name: string;
}

export interface IAggregatedVisit {
    // unique user count
    count: number;
    totalCount: number;
    date: string;
}