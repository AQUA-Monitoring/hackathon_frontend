import { storeToRefs } from 'pinia'
import { useNotificationsStore } from './store'

export function useNotifications() {
  const store = useNotificationsStore()
  return { ...storeToRefs(store), store }
}
