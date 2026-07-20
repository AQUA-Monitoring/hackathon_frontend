import api from '@/app/plugins/axios'
import type {
  OperationalAlert,
  OperationalAlertFilters,
  OperationalAlertsPage,
  PushConfig,
  RegionSubscription,
} from './types'

export class NotificationsApi {
  async listAlerts(filters: OperationalAlertFilters = {}) {
    const { data } = await api.get<OperationalAlertsPage>('/operational-alerts/', {
      params: filters,
    })
    return data
  }

  async confirm(id: string, reason = '') {
    const { data } = await api.post<OperationalAlert>(`/operational-alerts/${id}/confirm/`, {
      reason,
    })
    return data
  }

  async dismiss(id: string, reason = '') {
    const { data } = await api.post<OperationalAlert>(`/operational-alerts/${id}/dismiss/`, {
      reason,
    })
    return data
  }

  async resolve(id: string, notifySubscribers: boolean, reason = '') {
    const { data } = await api.post<OperationalAlert>(`/operational-alerts/${id}/resolve/`, {
      notify_subscribers: notifySubscribers,
      reason,
    })
    return data
  }

  async listRegionSubscriptions() {
    const { data } = await api.get<{ results: RegionSubscription[] }>('/region-subscriptions/')
    return data.results
  }

  async followRegion(regionId: string) {
    const { data } = await api.post<RegionSubscription>('/region-subscriptions/', {
      region_id: regionId,
    })
    return data
  }

  async unfollowRegion(regionId: string) {
    await api.delete('/region-subscriptions/', { params: { region_id: regionId } })
  }

  async getPushConfig() {
    const { data } = await api.get<PushConfig>('/push-subscriptions/config/')
    return data
  }

  async registerPush(subscription: PushSubscriptionJSON) {
    await api.post('/push-subscriptions/', subscription)
  }

  async removePush(endpoint: string) {
    await api.delete('/push-subscriptions/', { data: { endpoint } })
  }
}

export const notificationsApi = new NotificationsApi()
