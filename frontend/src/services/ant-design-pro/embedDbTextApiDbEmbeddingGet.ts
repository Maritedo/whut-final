// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Embed Db Text GET /api/db/embedding */
export async function embedDbTextApiDbEmbeddingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.embedDbTextApiDbEmbeddingGetParams,
  options?: { [key: string]: any },
) {
  return request<API.ReturnMessage>('/api/db/embedding', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
