// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List Db GET /api/db/list */
export async function listDbApiDbListGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listDbApiDbListGetParams,
  options?: { [key: string]: any },
) {
  return request<API.DatabaseMetaOutput[]>('/api/db/list', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}
