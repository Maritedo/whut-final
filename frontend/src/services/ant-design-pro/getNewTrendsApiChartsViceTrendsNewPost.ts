// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get New Trends POST /api/charts/vice-trends/new */
export async function getNewTrendsApiChartsViceTrendsNewPost(
  body: API.SearchRequest,
  options?: { [key: string]: any },
) {
  return request<Record<string, any>>('/api/charts/vice-trends/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
