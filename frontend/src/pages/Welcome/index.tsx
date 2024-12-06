import SearchLite from '@/components/SearchComplex/SearchLite';
import { listDbApiDbListGet } from '@/services/ant-design-pro/listDbApiDbListGet';
import { PageContainer } from '@ant-design/pro-components';
import { useRequest, history } from '@umijs/max';
import { Card, Col, FormInstance, Row } from 'antd';
import React from 'react';


import IntroduceRow from './IntroduceRow';
import HotNewTopics from './HotNewTopics';
import { getViceTrendsApiChartsViceTrendPost } from '@/services/ant-design-pro/getViceTrendsApiChartsViceTrendPost';
import { getCategoriesPercentageApiChartsCategoriesPost } from '@/services/ant-design-pro/getCategoriesPercentageApiChartsCategoriesPost';
import { getNewTrendsApiChartsViceTrendsNewPost } from '@/services/ant-design-pro/getNewTrendsApiChartsViceTrendsNewPost';
import { getHotTrendsApiChartsViceTrendsHotPost } from '@/services/ant-design-pro/getHotTrendsApiChartsViceTrendsHotPost';
import { getWordsCloudApiChartsWordsCloudPost } from '@/services/ant-design-pro/getWordsCloudApiChartsWordsCloudPost';

type tEvent = React.ChangeEvent<HTMLInputElement> |
  React.MouseEvent<HTMLElement> |
  React.KeyboardEvent<HTMLInputElement> | undefined;

type tInfo = { source?: 'clear' | 'input'; } | undefined

import useStylesA from './styleA';
import DbSelector from '@/components/SearchComplex/DbSelector';

const Info: React.FC<{
  title: React.ReactNode;
  value: React.ReactNode;
  bordered?: boolean;
}> = ({ title, value, bordered }) => {
  const { styles } = useStylesA();
  return (
    <div className={styles.headerInfo} >
      <span>{title}</span>
      <p>{value}</p>
      {bordered && <em />}
    </div>
  );
};

const genSearchRequest = (db_id: string): API.SearchRequest => {
  return {
    db_id: db_id,
    terms: [],
    page: null,
    page_size: null,
    filters: null,
    sub_terms: null,
    date_range: null,
  }
}


const Welcome: React.FC = () => {

  const defaultDbId = '65e94e64-e526-4298-981b-8168eb142605';

  const { data: dbMetas } = useRequest(listDbApiDbListGet, {
    onSuccess: (data) => {
      runRequests(defaultDbId, data)
    }
  });


  const { data: dbTrend, run: runDbTrend } = useRequest(
    (db_id: string) => {
      return getViceTrendsApiChartsViceTrendPost(genSearchRequest(db_id));
    },
    {
      manual: true
    }
  );

  const { data: cateA, run: runCateA } = useRequest(
    (meta?: API.DatabaseMetaOutput) => {
      if (meta) {
        return getCategoriesPercentageApiChartsCategoriesPost(
          {
            field: meta.cate_fields[0],
          },
          genSearchRequest(meta.id),
        );
      }
    },
    {
      manual: true
    }
  );

  const { data: cateB, run: runCateB } = useRequest(
    (meta?: API.DatabaseMetaOutput) => {
      if (meta) {
        return getCategoriesPercentageApiChartsCategoriesPost(
          {
            field: meta.cate_fields[1],
          },
          genSearchRequest(meta.id),
        );
      }
    },
    {
      manual: true
    }
  );

  const { data: newTrData, run: runNewTr } = useRequest(
    (db_id?: string) => {
      if (db_id) {
        return getNewTrendsApiChartsViceTrendsNewPost(genSearchRequest(db_id));
      }
    },
    {
      manual: true
    }
  );

  const { data: hotTrData, run: runHotTr } = useRequest(
    (db_id?: string) => {
      if (db_id) {
        return getHotTrendsApiChartsViceTrendsHotPost(genSearchRequest(db_id));
      }
    },
    {
      manual: true
    }
  );

  const { data: wordCloudData, run: runWordCloud } = useRequest(
    (db_id?: string) => {
      if (db_id) {
        return getWordsCloudApiChartsWordsCloudPost(genSearchRequest(db_id));
      }
    },
    {
      manual: true
    }
  );

  const runRequests = (db_id: string, metas?: API.DatabaseMetaOutput[]) => {
    const _metas = metas ? metas : dbMetas;
    const _meta = _metas?.find(db => db.id === db_id);
    runDbTrend(db_id);
    runHotTr(db_id);
    runNewTr(db_id);
    runWordCloud(db_id);
    runCateA(_meta);
    runCateB(_meta);
  }

  const handleOnSearchAndSubmit = (
    searchValue: string,
    formData: API.SearchRequest,
    formInstance: FormInstance<any>,
    event?: tEvent,
    info?: tInfo,
    currentDbMeta?: API.DatabaseMetaOutput,
  ) => {
    // history.push(
    //   {
    //     pathname: "/search",
    //   },
    //   {
    //     formData, databaseMeta: currentDbMeta
    //   }
    // )
  };

  const handleSelectChange = (value: string) => {
    runRequests(value);
  };

  return <PageContainer>

    <Card bordered={false} style={{ margin: 25 }}>
      <Row>
        <Col sm={8} xs={24}>
          <Info title="系统项目数据库数量" value="8 座" bordered />
        </Col>
        <Col sm={8} xs={24}>
          <Info title="科创项目收录总数量" value="2,881,004 条" bordered />
        </Col>
        <Col sm={8} xs={24}>
          <Info title="收录数据涵盖的年份" value="1981 - 2023" />
        </Col>
      </Row>
    </Card>

    <div style={{ margin: 48, marginBottom: 36 }}>
      <DbSelector
        onSearchAndSubmit={handleOnSearchAndSubmit}
        databaseMetas={dbMetas || []}
        onSelectChange={handleSelectChange}
      />
    </div>

    <IntroduceRow
      dbTrend={dbTrend}
      cateDataA={cateA}
      cateDataB={cateB}
    />

    <HotNewTopics
      newTrends={newTrData}
      wordsCloudData={wordCloudData}
      hotTrends={hotTrData}
    />


  </PageContainer>

};

export default Welcome;
