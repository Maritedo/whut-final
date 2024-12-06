import { request } from '@umijs/max';

export interface BodyGenTopicsApiGenPost {
    /** Major */
    major: string;
    /** Dir */
    dir?: string;
    /** Skills */
    skills?: string[];
    /** Lessons */
    lessons?: string[];
    /** Remark */
    remark?: string;
    /** Keywords */
    keywords?: string[];
    /** Idea */
    idea?: string;
    /** Ref */
    ref?: File | null;
  };

export async function genTopicsApiGenPost(
    body: BodyGenTopicsApiGenPost,
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
  