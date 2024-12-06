// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Main Trends POST /api/charts/main-trend */
export async function getMainTrendsApiChartsMainTrendPost(
  body: API.SearchRequest,
  options?: { [key: string]: any },
) {
  return request<API.TimeSeriesStatPro>('/api/charts/main-trend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
