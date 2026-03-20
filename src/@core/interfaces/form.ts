export interface INotificationOption {
    id: number
    alert: string
    message: string
    icon: string
    neighborhood: string
}

export interface IFormField<T = any> {
    id: string
    label: string
    type: 'select' | 'text' | 'number'
    placeholder?: string
    autocomplete?: string
    options?: T[]
    name?: string
}
