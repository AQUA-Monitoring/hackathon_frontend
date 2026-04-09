export type AlertKey = 'CRISE!' | 'ALERTA!' | 'ATENÇÃO!' | 'MOBILIZAÇÃO!' | 'NORMALIDADE!'

export interface AlertInfo {
    bgClass: string
    description: string
}

export const ALERTS: Record<AlertKey, AlertInfo> = {
    'CRISE!': {
        bgClass: 'bg-[#6326CC] text-white',
        description: 'Probabilidade muito alta de alagamento.',
    },
    'ALERTA!': {
        bgClass: 'bg-[#FF0A0A] text-white',
        description: 'Probabilidade alta de alagamento.',
    },
    'ATENÇÃO!': {
        bgClass: 'bg-[#F87400] text-black',
        description: 'Probabilidade moderada de alagamento.',
    },
    'MOBILIZAÇÃO!': {
        bgClass: 'bg-[#FFE101] text-black',
        description: 'Probabilidade baixa de alagamento.',
    },
    'NORMALIDADE!': {
        bgClass: 'bg-[#00D42E] text-black',
        description: 'Probabilidade muito baixa de alagamento.',
    },
} as const
