// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Eval Result GET /api/eval */
export async function getEvalResultApiEvalGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getEvalResultApiEvalGetParams,
  options?: { [key: string]: any },
) {
  return request<API.EvalDetails>('/api/eval', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
