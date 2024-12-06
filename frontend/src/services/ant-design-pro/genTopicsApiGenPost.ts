// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Gen Topics POST /api/gen */
export async function genTopicsApiGenPost(
  body: API.BodyGenTopicsApiGenPost,
  options?: { [key: string]: any },
) {
  const formData = new FormData();

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
        } else {
          formData.append(ele, JSON.stringify(item));
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<string[]>('/api/gen', {
    method: 'POST',
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}
