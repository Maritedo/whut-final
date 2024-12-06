import { history, Link, useRequest } from '@umijs/max';
import { Button, Col, Form, Input, message, Popover, Progress, Row, Select, Space } from 'antd';
import type { Store } from 'antd/es/form/interface';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import useStyles from './style.style';
import { Footer } from '@/components';
import { registerApiUserRegisterPost } from "@/services/ant-design-pro/registerApiUserRegisterPost"


const FormItem = Form.Item;
const { Option } = Select;

const passwordProgressMap: {
  'progress-ok': 'success';
  'progress-pass': 'normal';
  'progress-poor': 'exception';
} = {
  'progress-ok': 'success',
  'progress-pass': 'normal',
  'progress-poor': 'exception',
};
const Register: FC = () => {
  const { styles } = useStyles();
  const [open, setVisible]: [boolean, any] = useState(false);
  const [popover, setPopover]: [boolean, any] = useState(false);
  const confirmDirty = false;
  let interval: number | undefined;

  const passwordStatusMap = {
    'progress-ok': (
      <div className={styles.success}>
        <span>强度：强</span>
      </div>
    ),
    'progress-pass': (
      <div className={styles.warning}>
        <span>强度：中</span>
      </div>
    ),
    'progress-poor': (
      <div className={styles.error}>
        <span>强度：太短</span>
      </div>
    ),
  };

  const [form] = Form.useForm();
  useEffect(
    () => () => {
      clearInterval(interval);
    },
    [interval],
  );

  const getPasswordStatus = () => {
    const value = form.getFieldValue('password');
    if (value && value.length > 9) {
      return 'progress-ok';
    }
    if (value && value.length > 5) {
      return 'progress-pass';
    }
    return 'progress-poor';
  };
  const { loading: submitting, run: register } = useRequest<API.ReturnMessage>(
    registerApiUserRegisterPost,
    {
      manual: true,
      onSuccess: (data, params) => {
        if (data.status === true) {
          message.success(data.message);

        }
      },
    });
  const onFinish = (values: Store) => {
    register(values);
  };
  const checkConfirm = (_: any, value: string) => {
    const promise = Promise;
    if (value && value !== form.getFieldValue('password')) {
      return promise.reject('两次输入的密码不匹配!');
    }
    return promise.resolve();
  };
  const checkPassword = (_: any, value: string) => {
    const promise = Promise;
    // 没有值的情况
    if (!value) {
      setVisible(!!value);
      return promise.reject('请输入密码!');
    }
    // 有值的情况
    if (!open) {
      setVisible(!!value);
    }
    setPopover(!popover);
    if (value.length < 6) {
      return promise.reject('');
    }
    if (value && confirmDirty) {
      form.validateFields(['confirm']);
    }
    return promise.resolve();
  };

  const renderPasswordProgress = () => {
    const value = form.getFieldValue('password');
    const passwordStatus = getPasswordStatus();
    return value && value.length ? (
      <div>
        <Progress
          status={passwordProgressMap[passwordStatus]}
          strokeWidth={6}
          percent={value.length * 10 > 100 ? 100 : value.length * 10}
          showInfo={false}
        />
      </div>
    ) : null;
  };
  return (
    <div className={styles.main} style={{
      flex: '1',
      padding: '32px 0',
    }}>
      <h1>注册</h1>
      <Form form={form} name="UserRegister" onFinish={onFinish}>

        <FormItem
          name="name"
          rules={[
            {
              required: true,
              message: '请输入用户名!',
            }
          ]}
        >
          <Input size="large" placeholder="用户名" />
        </FormItem>

        <FormItem
          name="id"
          rules={[
            {
              required: true,
              message: '请输入手机号!',
            },
            {
              pattern: /^\d{11}$/,
              message: '手机号格式错误!',
            },
          ]}
        >
          <Input size="large" placeholder="手机号" />
        </FormItem>

        <FormItem
          name="org_name"
          rules={[
            {
              required: true,
              message: '请输入组织名!',
            }
          ]}
        >
          <Input size="large" placeholder="组织名" />
        </FormItem>

        <FormItem
          name="privilege"
        >
          <Input size="large" defaultValue={0} value={0} />
        </FormItem>

        <Popover
          getPopupContainer={(node) => {
            if (node && node.parentNode) {
              return node.parentNode as HTMLElement;
            }
            return node;
          }}
          content={
            open && (
              <div
                style={{
                  padding: '4px 0',
                }}
              >
                {passwordStatusMap[getPasswordStatus()]}
                {renderPasswordProgress()}
                <div
                  style={{
                    marginTop: 10,
                  }}
                >
                  <span>请至少输入 6 个字符。请不要使用容易被猜到的密码。</span>
                </div>
              </div>
            )
          }
          overlayStyle={{
            width: 240,
          }}
          placement="right"
          open={open}
        >

          <FormItem
            name="password_hash"
            className={
              form.getFieldValue('password_hash') &&
              form.getFieldValue('password_hash').length > 0 &&
              styles.password
            }
            rules={[
              {
                validator: checkPassword,
              },
            ]}
          >
            <Input size="large" type="password" placeholder="至少6位密码，区分大小写" />
          </FormItem>
        </Popover>

        <FormItem

          rules={[
            {
              required: true,
              message: '确认密码',
            },
            {
              validator: checkConfirm,
            },
          ]}
        >
          <Input size="large" type="password" placeholder="确认密码" />
        </FormItem>

        <FormItem>
          <div className={styles.footer}>
            <Button
              size="large"
              loading={submitting}
              className={styles.submit}
              type="primary"
              htmlType="submit"
            >
              <span>注册</span>
            </Button>
            <Link to="/user/login">
              <span>使用已有账户登录</span>
            </Link>
          </div>
        </FormItem>

      </Form>
      
    </div>
  );
};
export default Register;
