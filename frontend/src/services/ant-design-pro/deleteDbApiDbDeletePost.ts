// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Delete Db POST /api/db/delete */
export async function deleteDbApiDbDeletePost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteDbApiDbDeletePostParams,
  options?: { [key: string]: any },
) {
  return request<API.ReturnMessage>('/api/db/delete', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
