export interface IMenuOption {
  label: string
  icon: string
  link: string
}

export interface IMenu {
  id: string
  options: IMenuOption[]
}
