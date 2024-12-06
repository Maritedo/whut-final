// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Create Db POST /api/db/create */
export async function createDbApiDbCreatePost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.createDbApiDbCreatePostParams,
  body: API.DatabaseMetaInput,
  options?: { [key: string]: any },
) {
  return request<API.ReturnMessage>('/api/db/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...params },
    data: body,
    ...(options || {}),
  });
}
