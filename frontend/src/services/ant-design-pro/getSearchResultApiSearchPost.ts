// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Search Result POST /api/search */
export async function getSearchResultApiSearchPost(
  body: API.SearchRequest,
  options?: { [key: string]: any },
) {
  return request<API.SearchedData>('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
