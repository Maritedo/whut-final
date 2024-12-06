// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Categories Percentage POST /api/charts/categories */
export async function getCategoriesPercentageApiChartsCategoriesPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCategoriesPercentageApiChartsCategoriesPostParams,
  body: API.SearchRequest,
  options?: { [key: string]: any },
) {
  return request<API.CatePercent[]>('/api/charts/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      ...params,
    },
    data: body,
    ...(options || {}),
  });
}
