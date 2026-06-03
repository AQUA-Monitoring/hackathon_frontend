export type AlertKey = 'CRISE!' | 'ALERTA!' | 'ATENÇÃO!' | 'MOBILIZAÇÃO!' | 'NORMALIDADE!'

export interface AlertInfo {
  title: AlertKey
  description: string
  bgClass: string
  textClass?: string
}

export const ALERTS: AlertInfo[] = [
  {
    title: 'CRISE!',
    description: 'Probabilidade muito alta de alagamento.',
    bgClass: 'bg-[#6326CC] text-white',
  },
  {
    title: 'ALERTA!',
    description: 'Probabilidade alta de alagamento.',
    bgClass: 'bg-[#FF0A0A] text-white',
  },
  {
    title: 'ATENÇÃO!',
    description: 'Probabilidade moderada de alagamento.',
    bgClass: 'bg-[#F87400] text-black',
  },
  {
    title: 'MOBILIZAÇÃO!',
    description: 'Probabilidade baixa de alagamento.',
    bgClass: 'bg-[#FFE101] text-black',
  },
  {
    title: 'NORMALIDADE!',
    description: 'Probabilidade muito baixa de alagamento.',
    bgClass: 'bg-[#00D42E] text-black',
  },
]
