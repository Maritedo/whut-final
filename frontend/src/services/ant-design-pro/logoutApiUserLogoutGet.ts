// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Logout GET /api/user/logout */
export async function logoutApiUserLogoutGet(options?: { [key: string]: any }) {
  return request<API.ReturnMessage>('/api/user/logout', {
    method: 'GET',
    ...(options || {}),
  });
}
