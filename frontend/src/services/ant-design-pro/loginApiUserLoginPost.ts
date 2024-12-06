// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Login POST /api/user/login */
export async function loginApiUserLoginPost(
  body: API.UserLoginInput,
  options?: { [key: string]: any },
) {
  return request<API.ReturnMessage>('/api/user/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
