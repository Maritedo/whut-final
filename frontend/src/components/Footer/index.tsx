import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (

    <DefaultFooter

      style={{
        background: 'none',
      }}

      links={[
        {
          key: '华东师范大学',
          title: '华东师范大学',
          href: 'https://www.ecnu.edu.cn/',
          blankTarget: true,
        },
        {
          key: 'github',
          title: <><GithubOutlined /> Jayden Cheng </>,
          href: 'https://github.com/realJaydenCheng',
          blankTarget: true,
        }
      ]}

      copyright={
        <a href='https://blog.csdn.net/JaydenCheng'>
          经济与管理学院 程嘉豪</a>
      }

    />

  );
};

export default Footer;
