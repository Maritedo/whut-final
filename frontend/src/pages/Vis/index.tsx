import { PageContainer } from "@ant-design/pro-components";
import { Card, Col, Row } from "antd";

import useStylesA from './styleA';
import { history, Outlet, useRequest } from "@umijs/max";
import SearchComplex from "@/components/SearchComplex";
import { listDbApiDbListGet } from "@/services/ant-design-pro/listDbApiDbListGet";
import { useState } from "react";
import { getCategoriesPercentageApiChartsCategoriesPost } from "@/services/ant-design-pro/getCategoriesPercentageApiChartsCategoriesPost";
import { getWordsCloudApiChartsWordsCloudPost } from "@/services/ant-design-pro/getWordsCloudApiChartsWordsCloudPost";
import { getMainTrendsApiChartsMainTrendPost } from "@/services/ant-design-pro/getMainTrendsApiChartsMainTrendPost";
import { getTrendsListApiChartsViceTrendsListPost } from "@/services/ant-design-pro/getTrendsListApiChartsViceTrendsListPost";
import { getRecWordsApiChartsRecGet } from "@/services/ant-design-pro/getRecWordsApiChartsRecGet";
import { getGraphDataApiChartsGraphPost } from "@/services/ant-design-pro/getGraphDataApiChartsGraphPost";


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

const tabList = [
    {
        key: "trend",
        tab: "立项趋势",
    },
    {
        key: "cate",
        tab: "分类统计",
    },
    {
        key: "hot",
        tab: "相关热词",
    },
    {
        key: "graph",
        tab: "主题图谱",
    },
    {
        key: "rec",
        tab: "潜力推荐",
    }
]

// https://reactrouter.com/en/6.23.0/components/outlet
// https://reactrouter.com/en/6.23.0/hooks/use-outlet-context


interface VisContext {
    trendData?: API.TimeSeriesStatPro;
    cateDataA?: API.CatePercent[];
    cateDataB?: API.CatePercent[];
    cloudData?: Record<string, any>[];
    graphData?: API.CoOccurrence;
    recData?: API.WordXY[];
    sRequest?: API.SearchRequest;
    trendsCloudData?: Record<string, any>;
    trendsRecData?: Record<string, any>;
    trendsGraphData?: Record<string, any>;
}

const Vis = () => {

    const [visContext, setVisContext] = useState<VisContext>({})
    const [search, setSearch] = useState<string>('')
    const [tabKey, setTabKey] = useState<string>("trend")

    const { data: dbMetas } = useRequest<API.DatabaseMetaOutput[]>(
        listDbApiDbListGet,
    );

    const { run: runTrend } = useRequest<API.TimeSeriesStatPro>(
        (s_request: API.SearchRequest) => {
            return getMainTrendsApiChartsMainTrendPost(s_request);
        },
        {
            manual: true,
            onSuccess: (trendData) => {
                setVisContext({ ...visContext, trendData });
            },
        },
    );

    const { run: runCateA } = useRequest<API.CatePercent[]>(
        (s_request: API.SearchRequest, field: string) => {
            return getCategoriesPercentageApiChartsCategoriesPost({ field }, s_request);
        },
        {
            manual: true,
            onSuccess: (cateDataA) => {
                setVisContext({ ...visContext, cateDataA });
            },
        },
    );

    const { run: runCateB } = useRequest<API.CatePercent[]>(
        (s_request: API.SearchRequest, field: string) => {
            return getCategoriesPercentageApiChartsCategoriesPost({ field }, s_request);
        },
        {
            manual: true,
            onSuccess: (cateDataB) => {
                setVisContext({ ...visContext, cateDataB });
            },
        },
    );

    const { run: runCloudTrends } = useRequest<Record<string, any>>(
        (s_requests, words) => {

            return getTrendsListApiChartsViceTrendsListPost({
                s_requests: s_requests || {
                    db_id: "65e94e64-e526-4298-981b-8168eb142605"
                },
                words: words || []
            })
        },
        {
            manual: true,
            onSuccess: (trendsCloudData) => {
                setVisContext({ ...visContext, trendsCloudData });
            }
        }
    );
    const { run: runCloud } = useRequest<Record<string, any>[]>(
        (s_request: API.SearchRequest) => {
            return getWordsCloudApiChartsWordsCloudPost(s_request)
        },
        {
            manual: true,
            onSuccess: (cloudData) => {
                setVisContext({ ...visContext, cloudData });
                runCloudTrends(visContext.sRequest, cloudData.map(e => e.text));
            },
        },
    );

    const { run: runRecTrends } = useRequest<Record<string, any>>(
        (s_requests, words) => {

            return getTrendsListApiChartsViceTrendsListPost({
                s_requests: s_requests || {
                    db_id: "65e94e64-e526-4298-981b-8168eb142605"
                },
                words: words || []
            })
        },
        {
            manual: true,
            onSuccess: (trendsRecData) => {
                setVisContext({ ...visContext, trendsRecData });
            }
        }
    );
    const { run: runRec } = useRequest<API.WordXY[]>(
        (word: string) => {
            return getRecWordsApiChartsRecGet({ word });
        },
        {
            manual: true,
            onSuccess: (recData) => {
                setVisContext({ ...visContext, recData });
                runRecTrends(visContext.sRequest, recData.map(e => e.word));
            },
        }
    );

    const { run: runGraphTrends } = useRequest<Record<string, any>>(
        (s_requests, words) => {

            return getTrendsListApiChartsViceTrendsListPost({
                s_requests: s_requests || {
                    db_id: "65e94e64-e526-4298-981b-8168eb142605"
                },
                words: words || []
            })
        },
        {
            manual: true,
            onSuccess: (trendsGraphData) => {
                setVisContext({ ...visContext, trendsGraphData });
            }
        }
    );
    const { run: runGraph } = useRequest<API.CoOccurrence>(
        (s_request: API.SearchRequest) => {
            return getGraphDataApiChartsGraphPost(s_request);
        },
        {
            manual: true,
            onSuccess: (graphData) => {
                setVisContext({ ...visContext, graphData });
                runGraphTrends(visContext.sRequest, graphData?.nodes.map(e => e.name));
            },
        }
    );

    const handleSearch = (
        value: string,
        formData: API.SearchRequest,
        formInstance: any,
        event: any,
        info: any,
        currentMeta?: API.DatabaseMetaOutput
    ) => {
        setSearch(value);
        runTrend(formData);
        runCateA(formData, currentMeta?.cate_fields[0]);
        runCateB(formData, currentMeta?.cate_fields[1]);
        runCloud(formData);
        runRec(value);
        runGraph(formData);
    };

    const currentCnt = visContext.trendData?.values[
        visContext.trendData?.values.length - 1
    ];
    const currentDlt = visContext.trendData?.percentages[
        visContext.trendData?.percentages.length - 1
    ];
    const currentFlag = (currentDlt && currentDlt > 0) ? "#FF4646" : "#408888";

    const headerCard = <>
        <SearchComplex
            onSearchAndSubmit={handleSearch}
            databaseMetas={dbMetas || []}
        />
        <Card bordered={false} style={{ margin: 25, padding: 5 }}>
            <Row style={{ margin: 10 }}>
                <Col sm={8} xs={24}>
                    <Info title="关键词" value={search} bordered />
                </Col>
                <Col sm={8} xs={24}>
                    <Info title="立项数量" value={`${currentCnt || 0} 条`} bordered />
                </Col>
                <Col sm={8} xs={24}>
                    <Info title="同比变化" value={
                        <span style={{ color: currentFlag }}>
                            <b>{(currentDlt && currentDlt > 0) ? '+ ' : ' '} </b>
                            {((currentDlt || 0) * 100).toFixed(2)}%
                        </span>
                    } />
                </Col>
            </Row>
        </Card>
    </>

    const handleTabChange = (key: string) => {
        history.push(`/vis/${key}`);
        setTabKey(key);
    };

    return <PageContainer
        content={headerCard}
        tabList={tabList}
        tabActiveKey={tabKey}
        onTabChange={handleTabChange}
        title="可视分析"
    >
        <Outlet context={visContext satisfies VisContext} />
    </PageContainer>

}

export default Vis;

export {
    VisContext
};
