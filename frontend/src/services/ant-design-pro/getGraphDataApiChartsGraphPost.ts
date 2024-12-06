// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Graph Data POST /api/charts/graph */
export async function getGraphDataApiChartsGraphPost(
  body: API.SearchRequest,
  options?: { [key: string]: any },
) {
  return request<API.CoOccurrence>('/api/charts/graph', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
