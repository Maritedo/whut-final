// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Trends List POST /api/charts/vice-trends/list */
export async function getTrendsListApiChartsViceTrendsListPost(
  body: API.BodyGetTrendsListApiChartsViceTrendsListPost,
  options?: { [key: string]: any },
) {
  return request<Record<string, any>>('/api/charts/vice-trends/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
