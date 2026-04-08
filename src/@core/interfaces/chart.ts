export interface IDataset {
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
}

export interface IOption {
    labels: string[]
    datasets: IDataset[]
}

export interface IChart {
    id: string
    options: IOption
}
