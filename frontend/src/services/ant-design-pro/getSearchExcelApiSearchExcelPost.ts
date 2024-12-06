// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Search Excel POST /api/search/excel */
export async function getSearchExcelApiSearchExcelPost(
  body: API.SearchRequest,
  options?: { [key: string]: any },
) {
  return request<any>('/api/search/excel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    responseType: 'blob',
    ...(options || {}),
  });
}
