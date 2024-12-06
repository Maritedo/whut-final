import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import {
  Button,
  Card,
  Dropdown,
  Input,
  List,
  Modal,
  Progress,
} from 'antd';
import type { FC } from 'react';
import React, { useState } from 'react';
import OperationModal from './OperationModal';
import useStyles from './style.style';

import cookie from 'react-cookies'

import { listDbApiDbListGet } from '@/services/ant-design-pro/listDbApiDbListGet';
import { deleteDbApiDbDeletePost } from '@/services/ant-design-pro/deleteDbApiDbDeletePost';
import { createDbApiDbCreatePost } from '@/services/ant-design-pro/createDbApiDbCreatePost';
import UploadModal from './UploadModal';
import { importDataApiDbImportPost, BodyImportDataApiDbImportPost, getDbImportTemplateApiDbImportTemplateGet } from './service'
import { embedDbTextApiDbEmbeddingGet } from '@/services/ant-design-pro/embedDbTextApiDbEmbeddingGet';


const { Search } = Input;

const ListContent = (data: API.DatabaseMetaOutput) => {
  const { styles } = useStyles();
  return (
    <div>
      <div className={styles.listContentItem}>
        <span>创建用户</span>
        <p>{data.user_name}</p>
      </div>
      <div className={styles.listContentItem}>
        <span>创建时间</span>
        <p> {data.create_time} </p>
      </div>
      <div className={styles.listContentItem}>
      </div>
    </div>
  );
};

const databaseMetaToDescription = (item: API.DatabaseMetaOutput) => {
  // return `${item.id}：` +
  // `创建用户：${item.user_name}（${item.user_id}）；` +
  // `创建时间：${item.create_time}；` + 
  // `所属组织：${item.org_name}；标题字段：${item.title_field}，时间字段：${item.time_field}；` +
  // `分类字段：${item.cate_fields.join("、")}；` +
  // `标识字段：${item.id_fields.join("、")}；` +
  // `描述字段：${item.text_fields.join("、")}`

  return `所属组织：${item.org_name}; ` +
    `分类字段：${item.cate_fields.join("、")}; ` +
    `描述字段：${item.text_fields.join("、")}; `
}


export const BasicList: FC = () => {

  const { styles } = useStyles();
  const [done, setDone] = useState<boolean>(false);
  const [open, setVisible] = useState<boolean>(false);
  const [current, setCurrent] = useState<Partial<API.DatabaseMetaOutput> | undefined>(undefined);

  // see:
  // https://ahooks.js.org/zh-CN/hooks/use-request/basic/#%E7%AB%8B%E5%8D%B3%E5%8F%98%E6%9B%B4%E6%95%B0%E6%8D%AE
  const {
    data: listData,
    loading,
  } = useRequest<API.DatabaseMetaOutput[]>(listDbApiDbListGet,);

  const list = listData || [];

  const paginationProps = {
    showSizeChanger: true,
    showQuickJumper: true,
    pageSize: 5,
    total: list.length,
  };

  const showEditModal = (item: API.DatabaseMetaOutput) => {
    setVisible(true);
    setCurrent(item);
  };

  const deleteItem = (id: string) => {
    deleteDbApiDbDeletePost({ db_id: id });
  };

  const embedItem = (id: string) => {
    embedDbTextApiDbEmbeddingGet({ db_id: id });
  }

  const { run: runDownloadTemplate } = useRequest(
    getDbImportTemplateApiDbImportTemplateGet,
    {
      manual: true,
      onSuccess: (data, params) => {
        console.log(data);
        // 创建一个隐藏的链接元素
        const url = window.URL.createObjectURL(
          new Blob(
            [data],
            {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          )
        );
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '导入模板.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
    }
  )

  const downloadTemplate = (currentItem: API.DatabaseMetaOutput) => {
    runDownloadTemplate({ db_id: currentItem.id });

  }

  const showDeleteConfirm = (currentItem: API.DatabaseMetaOutput) => {
    Modal.confirm({
      title: '删除任务',
      content: '确定删除该数据库吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => deleteItem(currentItem.id),
    });
  };

  const showEmbedConfirm = (currentItem: API.DatabaseMetaOutput) => {
    Modal.confirm({
      title: '嵌入数据库',
      content: '确定将刚数据库中的文本进行嵌入操作吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => embedItem(currentItem.id),
    });
  }

  const handleItemOperation = (key: string | number, currentItem: API.DatabaseMetaOutput) => {
    if (key === 'edit') {
      showEditModal(currentItem);
    } else if (key === 'delete') {
      showDeleteConfirm(currentItem);
    } else if (key === 'import') {
      showUploadModal(currentItem);
    } else if (key === 'embed') {
      showEmbedConfirm(currentItem);
    } else if (key === 'template') {
      downloadTemplate(currentItem);
    }
  };

  const extraContent = (
    <div>
      <Search className={styles.extraContentSearch} placeholder="请输入" onSearch={() => ({})} />
    </div>
  );

  const MoreBtn: React.FC<{ item: API.DatabaseMetaOutput }> = ({ item }) => (
    <Dropdown
      menu={{
        onClick: ({ key }) => handleItemOperation(key, item),
        items: [
          {
            key: 'import',
            label: '导入',
          },
          {
            key: 'embed',
            label: '嵌入',
          },
          {
            key: 'edit',
            label: '编辑',
          },
          {
            key: 'delete',
            label: '删除',
          },
          {
            key: 'template',
            label: '下载模板',
          },
        ],
      }}
    >
      <a>
        更多 <DownOutlined />
      </a>
    </Dropdown>
  );

  const handleDone = () => {
    setDone(false);
    setVisible(false);
    setCurrent({});
  };

  const handleSubmit = (values: API.DatabaseMetaOutput) => {
    setDone(true);
    const user_id = cookie.load("user_id")
    createDbApiDbCreatePost({ user_id }, values)
  };

  const renderListItem = (item: API.DatabaseMetaOutput) => {
    return (
      <List.Item
        actions={[

          <a
            key="import"
            onClick={(e) => {
              e.preventDefault();
              showUploadModal(item);
            }}
          >
            导入
          </a>,

          <a
            key="embed"
            onClick={(e) => {
              e.preventDefault();
              showEmbedConfirm(item);
            }}
          >
            嵌入
          </a>,

          <a
            key="delete"
            onClick={(e) => {
              e.preventDefault();
              showDeleteConfirm(item);
            }}
            style={{ color: 'red' }}
          >
            删除
          </a>,

          <MoreBtn key="more" item={item} />,

        ]}
      >

        <List.Item.Meta
          title={item.name}
          description={databaseMetaToDescription(item)}
          style={{
            overflow: "hidden"
          }}
        />

        {/* https://stackoverflow.com/questions/59969756/not-assignable-to-type-intrinsicattributes-intrinsicclassattributes-react-js */}
        <ListContent {...item} />

      </List.Item>
    )

  }

  const [openUpload, setOpenUpload] = useState<boolean>(false);
  const [doneUpload, setDoneUpload] = useState<boolean>(false);
  const [uploadingCur, setUploadCur] = useState<BodyImportDataApiDbImportPost | undefined>(undefined);
  const showUploadModal = (item: API.DatabaseMetaOutput) => {
    setOpenUpload(true);
    const uploading: BodyImportDataApiDbImportPost = {
      db_id: item.id,
      data_files: []
    };
    setUploadCur(uploading)
  };
  const handleDoneUpload = () => {
    setDoneUpload(false);
    setOpenUpload(false);
    setUploadCur(undefined);
  };
  const handleSubmitUpload = (values: {
    db_id: string;
    data_files: any[];
  }) => {
    setDoneUpload(true);
    const upload_value: BodyImportDataApiDbImportPost = {
      db_id: values.db_id,
      data_files: values.data_files.map(file => file["originFileObj"])
    }
    importDataApiDbImportPost(upload_value);
  };

  return (
    <div>

      <PageContainer>
        <div className={styles.standardList}>
          <Card
            className={styles.listCard}
            bordered={false}

            styles={{
              body: {
                padding: '0 32px 40px 32px',
              }
            }}
            extra={extraContent}

          >

            <List
              size="large"
              rowKey="id"
              loading={loading}
              pagination={paginationProps}
              dataSource={list}
              renderItem={renderListItem}
            />

          </Card>
        </div>
      </PageContainer>

      <Button
        type="dashed"
        onClick={() => {
          setVisible(true);
        }}
        style={{
          width: '100%',
          marginBottom: 8,
        }}
      >
        <PlusOutlined />
        添加
      </Button>

      <OperationModal
        done={done}
        open={open}
        current={current}
        onDone={handleDone}
        onSubmit={handleSubmit}
      />

      <UploadModal
        done={doneUpload}
        open={openUpload}
        current={uploadingCur}
        onDone={handleDoneUpload}
        onSubmit={handleSubmitUpload}
      />

    </div>
  );

};

export default BasicList;
