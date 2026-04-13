import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IWeatherDetail } from '@/@core/interfaces/location'

export const useLocationStore = defineStore('location', () => {
    const neighborhood = ref<string | null>(null)
    const city = ref<string | null>(null)
    const date = ref('')

    const data = ref<IWeatherDetail[]>([
        {
            name: 'Probabilidade de enchente',
            icon: '/weather_information/danger.svg',
            scale: 15,
            message: 'NORMALIDADE!',
        },
    ])

    const displayData = computed(() => {
        return data.value.map((item) => {
            let newMessage: IWeatherDetail['message']

            if (item.scale <= 20) newMessage = 'NORMALIDADE!'
            else if (item.scale <= 40) newMessage = 'MOBILIZAÇÃO!'
            else if (item.scale <= 60) newMessage = 'ATENÇÃO!'
            else if (item.scale <= 80) newMessage = 'ALERTA!'
            else newMessage = 'CRISE!'

            return { ...item, message: newMessage }
        })
    })

    return {
        neighborhood,
        city,
        data,
        date,
        displayData,
    }
})
