import {
  ModalForm,
  ProForm,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Result } from 'antd';
import type { FC } from 'react';
import useStyles from './style.style';

import TagGroup from './tagGroup';

type OperationModalProps = {
  done: boolean;
  open: boolean;
  current: Partial<API.DatabaseMetaOutput> | undefined;
  onDone: () => void;
  onSubmit: (values: API.DatabaseMetaOutput) => void;
  children?: React.ReactNode;
};

const OperationModal: FC<OperationModalProps> = (props) => {

  const { styles } = useStyles();
  const { done, open, current, onDone, onSubmit, children } = props;
  if (!open) {
    return null;
  }
  return (

    <ModalForm<API.DatabaseMetaOutput>
      open={open}
      title="数据库编辑"
      className={styles.standardListForm}
      width={640}
      onFinish={async (values) => {
        onSubmit(values);
      }}
      initialValues={current}
      submitter={{
        render: (_, dom) => (done ? null : dom),
      }}
      trigger={<>{children}</>}
      modalProps={{
        onCancel: () => onDone(),
        destroyOnClose: true,
        styles: {
          body: done ? { padding: '72px 0', } : {},
        }
      }}
    >
      {!done ? (
        <>

          <ProFormText
            name="name"
            label="数据库名称"
            placeholder="请输入"
            initialValue={current?.name}
          />


          <ProFormText
            name="org_name"
            label="所属组织"
            placeholder="请输入"
            initialValue={current?.org_name || "public"}
          />


          <ProFormText
            name="title_field"
            label="选题字段"
            placeholder="请输入"
            initialValue={current?.title_field}
          />

          <ProFormText
            name="time_field"
            label="时间字段名称"
            placeholder="请输入"
            initialValue={current?.time_field}
          />

          <ProForm.Item
            name="cate_fields"
            label="分类字段"
          >
            <TagGroup value={current?.cate_fields} />
          </ProForm.Item>

          <ProForm.Item
            name="id_fields"
            label="标识字段"
          >
            <TagGroup value={current?.id_fields} />
          </ProForm.Item>

          <ProForm.Item
            name="text_fields"
            label="描述字段"
          >
            <TagGroup value={current?.text_fields} />
          </ProForm.Item>

        </>
      ) : (
        <Result
          status="success"
          title="操作成功"
          extra={
            <Button type="primary" onClick={onDone}>
              知道了
            </Button>
          }
          className={styles.formResult}
        />
      )}
    </ModalForm>
  );
};
export default OperationModal;
