// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Register POST /api/user/register */
export async function registerApiUserRegisterPost(
  body: API.User,
  options?: { [key: string]: any },
) {
  return request<API.ReturnMessage>('/api/user/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
