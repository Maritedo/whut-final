// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Db Import Template GET /api/db/import-template */
export async function getDbImportTemplateApiDbImportTemplateGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDbImportTemplateApiDbImportTemplateGetParams,
  options?: { [key: string]: any },
) {
  return request<any>('/api/db/import-template', {
    method: 'GET',
    params: {
      ...params,
    },
    responseType: 'blob',
    ...(options || {}),
  });
}
