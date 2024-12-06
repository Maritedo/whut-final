// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Root GET /api */
export async function rootApiGet(options?: { [key: string]: any }) {
  return request<API.ReturnMessage>('/api', {
    method: 'GET',
    ...(options || {}),
  });
}
