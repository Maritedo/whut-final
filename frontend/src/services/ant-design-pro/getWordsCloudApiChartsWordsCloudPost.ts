// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Words Cloud POST /api/charts/words-cloud */
export async function getWordsCloudApiChartsWordsCloudPost(
  body: API.SearchRequest,
  options?: { [key: string]: any },
) {
  return request<Record<string, any>[]>('/api/charts/words-cloud', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
