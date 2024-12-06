import { Footer, Question, AvatarDropdown, AvatarName } from '@/components';
import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import React from 'react';

import cookie from 'react-cookies'



const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

interface Cookies {
  user_id: string,
  user_name: string,
  user_privilege: number,
  org_name: string,
}

function getUserInfo(): Cookies {
  return {
    user_id: cookie.load("user_id", true),
    user_name: cookie.load("user_name", true),
    user_privilege: cookie.load("user_privilege", false),
    org_name: cookie.load("org_name", true),
  }
}

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: Cookies;
  loading?: boolean;
  fetchUserInfo?: () => Promise<Cookies | undefined>;
}> {
  const fetchUserInfo = async () => {
    const cookies = getUserInfo();
    if (cookies.user_id != "") {
      return cookies;
    } else {
      return {
        user_id: "",
        user_name: "",
        user_privilege: 0,
        org_name: "",
      }
    }
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {

  return {

    actionsRender: () => [<Question key="doc" />],

    waterMarkProps: {
      content: initialState?.currentUser?.user_name,
    },

    title: "大学生科创项目选题智能辅助系统",
    // see: https://blog.csdn.net/rock_23/article/details/119840134
    logo: <img alt="logo" src="/logo.png" />,

    avatarProps: {
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },

    footerRender: () => <Footer />,


    links: isDev
      ? [
        <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
          <LinkOutlined />
          <span>OpenAPI 文档</span>
        </Link>,
      ]
      : [],

    menuHeaderRender: undefined,

    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = {
  ...errorConfig,
};
