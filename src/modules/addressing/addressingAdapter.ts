import type {
  ReferenceBaseStatus,
  ReferenceBaseStatusDto,
  ReferenceEntity,
  ReferenceEntityDto,
  ReferenceNeighborhoodImpact,
  ReferenceNeighborhoodImpactDto,
  ReferenceTerritoryCollection,
  ReferenceTerritoryFeatureCollectionDto,
  ResolveReferenceArea,
  ResolveReferenceAreaDto,
} from './types/addressing'

const adaptReferenceEntity = (item: ReferenceEntityDto): ReferenceEntity => ({
  name: item.name,
  referenceCityId: item.reference_city_id ?? null,
  referenceRegionId: item.reference_region_id ?? null,
  referenceNeighborhoodId: item.reference_neighborhood_id ?? null,
})

export const adaptReferenceBaseStatus = (data: ReferenceBaseStatusDto): ReferenceBaseStatus => ({
  referenceBaseRevision: data.reference_base_revision,
  referenceBaseStatus: data.reference_base_status,
  referenceBaseActivatedAt: data.reference_base_activated_at,
  referenceBaseSchemaVersion: data.reference_base_schema_version,
  referenceBaseArchiveSha256: data.reference_base_archive_sha256,
})

export const adaptReferenceTerritories = (
  data: ReferenceTerritoryFeatureCollectionDto,
): ReferenceTerritoryCollection => ({
  type: 'FeatureCollection',
  referenceBaseRevision: data.reference_base_revision,
  features: data.features.map((feature) => ({
    type: 'Feature',
    id: feature.id,
    bbox: feature.bbox,
    geometry: feature.geometry,
    properties: {
      referenceTerritoryId: feature.properties.reference_territory_id,
      name: feature.properties.name,
      type: feature.properties.type,
      city: feature.properties.city,
      referenceCityId: feature.properties.reference_city_id,
      referenceRegionId:
        feature.properties.reference_region_id ??
        (feature.properties.type === 'region'
          ? feature.properties.reference_territory_id
          : null),
      referenceNeighborhoodId:
        feature.properties.reference_neighborhood_id ??
        (feature.properties.type === 'neighborhood'
          ? feature.properties.reference_territory_id
          : null),
      sourceRecordId: feature.properties.source_record_id ?? null,
    },
  })),
})

const adaptNeighborhoodImpact = (
  item: ReferenceNeighborhoodImpactDto,
): ReferenceNeighborhoodImpact => ({
  referenceNeighborhoodId: item.reference_neighborhood_id,
  name: item.name,
  relation: item.relation,
  intersectionAreaM2: item.intersection_area_m2,
  footprintFraction: item.footprint_fraction,
  region: item.region
    ? {
        referenceRegionId: item.region.reference_region_id,
        name: item.region.name,
      }
    : null,
})

export const adaptResolveReferenceArea = (data: ResolveReferenceAreaDto): ResolveReferenceArea => ({
  crs: data.crs,
  referenceBaseRevision: data.reference_base_revision,
  status: data.status,
  reasonCodes: data.reason_codes,
  method: data.method,
  city: adaptReferenceEntity(data.city),
  region: data.region ? adaptReferenceEntity(data.region) : null,
  neighborhood: data.neighborhood ? adaptReferenceEntity(data.neighborhood) : null,
  neighborhoods: data.neighborhoods.map(adaptNeighborhoodImpact),
  representativePoint: data.representative_point,
  primaryStreet: data.primary_street,
  primaryRoadAxisSegment: data.primary_road_axis_segment,
  algorithmVersion: data.algorithm_version,
})
