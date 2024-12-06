// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Vice Trends POST /api/charts/vice-trend */
export async function getViceTrendsApiChartsViceTrendPost(
  body: API.SearchRequest,
  options?: { [key: string]: any },
) {
  return request<API.TimeSeriesStat>('/api/charts/vice-trend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
