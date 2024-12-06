// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

type BodyImportDataApiDbImportPost = {
    /** Data Files */
    data_files: File[];
    /** Db Id */
    db_id: string;
  };


/** Import Data POST /api/db/import */
async function importDataApiDbImportPost(
  body: BodyImportDataApiDbImportPost,
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

  return request<API.ReturnMessage>('/api/db/import', {
    method: 'POST',
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** Get Db Import Template GET /api/db/import-template */
async function getDbImportTemplateApiDbImportTemplateGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDbImportTemplateApiDbImportTemplateGetParams,
  options?: { [key: string]: any },
) {
  return request<any>('/api/db/import-template', {
    method: 'GET',
    params: {
      ...params,
    },
    responseType: 'blob',
    ...(options || {}),
  });
}

async function getSearchExcelApiSearchExcelPost(
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


export {
    BodyImportDataApiDbImportPost,
    importDataApiDbImportPost,
    getDbImportTemplateApiDbImportTemplateGet,
    getSearchExcelApiSearchExcelPost
}
