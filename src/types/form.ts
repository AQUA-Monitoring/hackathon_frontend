export interface INotificationOption {
  id: number
  alert: string
  message: string
  icon: string
  neighborhood: string
}

export interface IField {
  placeholder?: string
  type: 'select' | 'text' | 'number' | 'password' | 'email' | 'date'
  autocomplete?: string
  options?: []
  name?: string
}

export interface IFormField {
  id: string
  label: string
  fields: IField[]
}
