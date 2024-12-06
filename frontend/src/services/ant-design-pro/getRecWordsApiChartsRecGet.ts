// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Rec Words GET /api/charts/rec */
export async function getRecWordsApiChartsRecGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRecWordsApiChartsRecGetParams,
  options?: { [key: string]: any },
) {
  return request<API.WordXY[]>('/api/charts/rec', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
