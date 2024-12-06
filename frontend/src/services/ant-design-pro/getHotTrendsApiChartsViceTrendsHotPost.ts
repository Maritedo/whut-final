// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Hot Trends POST /api/charts/vice-trends/hot */
export async function getHotTrendsApiChartsViceTrendsHotPost(
  body: API.SearchRequest,
  options?: { [key: string]: any },
) {
  return request<Record<string, any>>('/api/charts/vice-trends/hot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
