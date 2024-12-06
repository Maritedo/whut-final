import {
  ModalForm,
  ProFormText,
  ProFormUploadDragger,
} from '@ant-design/pro-components';
import { Button, Result } from 'antd';
import type { FC } from 'react';
import useStyles from './style.style';
import { BodyImportDataApiDbImportPost } from './service';

interface UploadModalProps {
  done: boolean;
  open: boolean;
  current?: BodyImportDataApiDbImportPost;
  onDone: () => void;
  onSubmit: (values: BodyImportDataApiDbImportPost) => void;
  children?: React.ReactNode;
}

const UploadModal: FC<UploadModalProps> = (props: UploadModalProps) => {

  const { styles } = useStyles();

  const { done, open, current, onDone, onSubmit, children } = props;

  if (!open) {
    return null;
  }
  return (

    <ModalForm<BodyImportDataApiDbImportPost>
      open={open}
      title="上传数据"
      className={styles.standardListForm}
      width={640}
      onFinish={async (values) => {
        onSubmit(values);
      }}
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
            name="db_id"
            label="数据库ID"
            placeholder="请输入"
            initialValue={current?.db_id}
          />

          <ProFormUploadDragger
            label="上传文件"
            name="data_files"
          />

        </>
      ) : (
        <Result
          status="success"
          title="导入成功"
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

}

export default UploadModal;
