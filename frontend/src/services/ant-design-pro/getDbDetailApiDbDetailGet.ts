// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Db Detail GET /api/db/detail */
export async function getDbDetailApiDbDetailGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDbDetailApiDbDetailGetParams,
  options?: { [key: string]: any },
) {
  return request<API.DatabaseMetaDetail>('/api/db/detail', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
