export interface IBlog {
    id: number
    title: string
    description: string
    link: {
        to: string
        label: string
    }
    img: string
}
