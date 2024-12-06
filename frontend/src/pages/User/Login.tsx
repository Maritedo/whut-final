import { Footer } from '@/components';
import { loginApiUserLoginPost } from '@/services/ant-design-pro/loginApiUserLoginPost';
import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormText,
} from '@ant-design/pro-components';
import { history, useModel, Helmet } from '@umijs/max';
import { Alert, message } from 'antd';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
  };
});

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

interface LoginState {
  status: boolean | null
}

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<LoginState>({ status: null });
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.UserLoginInput) => {

    // 登录
    const msg = await loginApiUserLoginPost(values);
    if (msg.status === true) {
      const defaultLoginSuccessMessage = '登录成功！'
      message.success(defaultLoginSuccessMessage);
      await fetchUserInfo();
      const urlParams = new URL(window.location.href).searchParams;
      history.push(urlParams.get('redirect') || '/');
      return;
    }
    // 如果失败去设置用户错误信息
    setUserLoginState(msg);

  };
  const { status } = userLoginState;

  return (

    <div className={styles.container}>

      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.png" />}
          title="大学生科研项目选题智能辅助系统"
          subTitle="实现大学生创新项目选题场景下的“文本检索-信息抽取-数据统计-智能生成”一条龙！"
          initialValues={{
            autoLogin: true,
          }}
          onFinish={async (values) => {
            await handleSubmit(values as API.UserLoginInput);
          }}
        >

          {
            status === false &&
            (
              <LoginMessage
                content={'账户或密码错误'}
              />
            )
          }

          <ProFormText
            name="id"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder={'请输入手机号'}
            rules={[
              {
                required: true,
                message: "请输入手机号!"
                ,
              },
            ]}
          />

          <ProFormText.Password
            name="password_hash"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder={'请输入密码'}
            rules={[
              {
                required: true,
                message: "请输入密码！",
              },
            ]}
          />

          <div
            style={{
              marginBottom: 24,
            }}
          >
            <a
              style={{
                float: 'right',
              }}
              href='/user/register'
            >
              注册账号
            </a>
          </div>

        </LoginForm>
      </div>

    </div>

  );
};

export default Login;
