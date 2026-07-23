import { reactive, ref, watch } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type {
  CameraAdministrativeStatus,
  CameraAnalysisStatus,
  CameraApiItem,
  CameraListFilters,
  CameraStreamStatus,
} from '../types/camera'

export type CameraOverviewMobileView = 'list' | 'map'

function queryText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function useCameraOverviewRoute(
  route: RouteLocationNormalizedLoaded,
  router: Router,
  load: (filters?: CameraListFilters) => Promise<void>,
  getById: (id: string) => Promise<CameraApiItem | null>,
) {
  const filtersOpen = ref(false)
  const mobileView = ref<CameraOverviewMobileView>('list')
  const selectedCamera = ref<CameraApiItem | null>(null)
  const mobileInspectionOpen = ref(false)
  let lastFilterSignature = ''
  let routeSyncGeneration = 0

  const filters = reactive({
    search: '',
    region_id: '',
    neighborhood_id: '',
    administrative_status: 'ACTIVE' as CameraAdministrativeStatus | '',
    stream_status: '' as CameraStreamStatus | '',
    analysis_status: '' as CameraAnalysisStatus | '',
  })

  function currentFilters(): CameraListFilters {
    return {
      search: filters.search.trim() || undefined,
      region_id: filters.region_id || undefined,
      neighborhood_id: filters.neighborhood_id || undefined,
      administrative_status: filters.administrative_status || undefined,
      stream_status: filters.stream_status || undefined,
      analysis_status: filters.analysis_status || undefined,
    }
  }

  function buildQuery(extra: Record<string, string | undefined> = {}) {
    const filterQuery = currentFilters()
    return {
      ...(filterQuery.search ? { search: filterQuery.search } : {}),
      ...(filterQuery.region_id ? { region_id: filterQuery.region_id } : {}),
      ...(filterQuery.neighborhood_id ? { neighborhood_id: filterQuery.neighborhood_id } : {}),
      ...(filterQuery.administrative_status
        ? { administrative_status: filterQuery.administrative_status }
        : { administrative_status: 'all' }),
      ...(filterQuery.stream_status ? { stream_status: filterQuery.stream_status } : {}),
      ...(filterQuery.analysis_status ? { analysis_status: filterQuery.analysis_status } : {}),
      ...(mobileView.value === 'map' ? { view: 'map' } : {}),
      ...(selectedCamera.value ? { camera: selectedCamera.value.id } : {}),
      ...extra,
    }
  }

  async function syncFromRoute() {
    const generation = ++routeSyncGeneration
    filters.search = queryText(route.query.search)
    filters.region_id = queryText(route.query.region_id)
    filters.neighborhood_id = queryText(route.query.neighborhood_id)
    const administrativeStatus = queryText(route.query.administrative_status)
    filters.administrative_status =
      administrativeStatus === 'all'
        ? ''
        : administrativeStatus === 'INACTIVE'
          ? 'INACTIVE'
          : 'ACTIVE'
    filters.stream_status = queryText(route.query.stream_status) as CameraStreamStatus | ''
    filters.analysis_status = queryText(route.query.analysis_status) as CameraAnalysisStatus | ''
    mobileView.value = route.query.view === 'map' ? 'map' : 'list'

    const signature = JSON.stringify(currentFilters())
    if (signature !== lastFilterSignature) {
      lastFilterSignature = signature
      await load(currentFilters())
    }

    const selectedId = queryText(route.query.camera)
    if (!selectedId) {
      selectedCamera.value = null
      return
    }
    if (!selectedCamera.value) mobileInspectionOpen.value = true
    const camera = await getById(selectedId)
    if (
      generation === routeSyncGeneration &&
      queryText(route.query.camera) === selectedId
    ) {
      selectedCamera.value = camera
    }
  }

  function applyFilters() {
    void router.replace({ query: buildQuery({ camera: undefined }) })
    filtersOpen.value = false
  }

  function clearFilters() {
    filters.region_id = ''
    filters.neighborhood_id = ''
    filters.administrative_status = 'ACTIVE'
    filters.stream_status = ''
    filters.analysis_status = ''
    applyFilters()
  }

  function changeMobileView(view: CameraOverviewMobileView) {
    mobileView.value = view
    void router.replace({ query: buildQuery({ view: view === 'map' ? 'map' : undefined }) })
  }

  function selectCamera(camera: CameraApiItem) {
    selectedCamera.value = camera
    mobileInspectionOpen.value = true
    void router.replace({ query: buildQuery({ camera: camera.id }) })
  }

  function closeInspection() {
    selectedCamera.value = null
    mobileInspectionOpen.value = false
    void router.replace({ query: buildQuery({ camera: undefined }) })
  }

  watch(() => route.fullPath, syncFromRoute, { immediate: true })

  return {
    filtersOpen,
    filters,
    mobileView,
    selectedCamera,
    mobileInspectionOpen,
    currentFilters,
    applyFilters,
    clearFilters,
    changeMobileView,
    selectCamera,
    closeInspection,
  }
}
