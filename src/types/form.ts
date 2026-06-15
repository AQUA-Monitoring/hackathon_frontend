export interface INotificationOption {
  id: number
  alert: string
  message: string
  icon: string
  neighborhood: string
}

export type FieldType =
  | 'select'
  | 'text'
  | 'number'
  | 'password'
  | 'email'
  | 'date'
  | 'dateborn'
  | 'file'
  | 'textarea'
  | 'group'

export interface IField {
  id?: string
  name?: string
  label?: string
  placeholder?: string
  type: FieldType
  autocomplete?: string
  options?: string[]
  message?: string
  fields?: IField[]
}

export interface IFormField {
  id: string
  label?: string
  fields: IField[]
  buttonText?: string
  isDeleteButton?: boolean
}
