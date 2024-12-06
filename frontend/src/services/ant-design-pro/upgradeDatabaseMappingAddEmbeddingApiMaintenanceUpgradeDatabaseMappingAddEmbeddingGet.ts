// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Upgrade Database Mapping Add Embedding GET /api/maintenance/upgrade-database-mapping-add-embedding */
export async function upgradeDatabaseMappingAddEmbeddingApiMaintenanceUpgradeDatabaseMappingAddEmbeddingGet(options?: {
  [key: string]: any;
}) {
  return request<API.ReturnMessage>('/api/maintenance/upgrade-database-mapping-add-embedding', {
    method: 'GET',
    ...(options || {}),
  });
}
