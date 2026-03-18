export interface IWeatherDetail {
    name: 'Probabilidade de enchente'
    icon: '/weather_information/danger.svg'
    scale: number
    message: 'NORMALIDADE!' | 'MOBILIZAÇÃO!' | 'ATENÇÃO!' | 'ALERTA!' | 'CRISE!'
}

export interface ILocation {
    neighborhood: string | null
    city: string | null
    data: IWeatherDetail[]
    date: string
}
