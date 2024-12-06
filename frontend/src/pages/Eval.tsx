import SearchLite from "@/components/SearchComplex/SearchLite";
import { getEvalResultApiEvalGet } from "@/services/ant-design-pro/getEvalResultApiEvalGet";
import { Gauge, Radar, Tiny } from "@ant-design/charts";
import { PageContainer, ProCard, StatisticCard } from "@ant-design/pro-components"
import { useRequest } from "@umijs/max";
import { useState } from "react";


const Eval = () => {

    const [scoreInfo, setScoreInfo] = useState<API.EvalDetails>({});
    const [searchText, setSearchText] = useState<string>("");

    const { loading, run: getScore } = useRequest<API.EvalDetails>(
        (text: string) => {
            return getEvalResultApiEvalGet({ text });
        },
        {
            manual: true,
            onSuccess: (data) => {
                setScoreInfo(data);
            }
        }
    )

    const radarData = [
        {
            dim: "新颖性",
            score: scoreInfo?.novelty_score || 0,
        },
        {
            dim: "应用价值",
            score: scoreInfo?.application_score || 0,
        },
        {
            dim: "学术价值",
            score: scoreInfo?.academic_score || 0,
        },
        {
            dim: "趋势表现",
            score: scoreInfo?.trend_score || 0,
        },
        {
            dim: "指标匹配度",
            score: scoreInfo?.main_score || 0,
        },
    ]

    const mainGauge = <Gauge
        data={{
            target: scoreInfo?.main_score || 0,
            total: 100,
            name: 'score',
            thresholds: [65, 80, 90, 100],
        }}
        autoFit={true}
        scale={{
            color: {
                range: ['#913700', '#776f00', '#5ea600', '#44dd00'],
            },
        }}
        style={{
            textContent: () => { return scoreInfo?.main_describe || " " },
        }}
        loading={loading}
    />

    const mainRadar = <Radar
        data={radarData}
        xField="dim"
        yField="score"
        loading={loading}
        area={{
            style: {
                fillOpacity: 0.2,
            },
        }}
        scale={{
            x: {
                padding: 1,
                align: 0,
            },
            y: {
                nice: true,
            },
        }}
        axis={{
            x: {
                title: false,
                grid: true,
                labelFontSize: 24,
                labelFontWeight: 700,
                labelSpacing: 10,
                labelFormatter: (label: string, index: number) => `${label}\n${radarData[index].score.toFixed(2)}`
            },
            y: {
                gridAreaFill: 'rgba(0, 0, 0, 0.04)',
                label: false,
                title: false,
            },
        }}
    />

    const subCard = (score?: number, label?: string, description?: string, color?: string) => {

        const bgColor = "#E8EFF5"

        const subRing = <Tiny.Ring
            percent={score ? score / 100 : 0}
            width={100}
            height={100}
            color={[bgColor, color || "blue"]}
            annotations={[
                {
                    type: 'text',
                    style: {
                        text: score?.toFixed(2) || " ",
                        x: '50%',
                        y: '50%',
                        textAlign: 'center',
                        fontSize: 14,
                    },
                },
            ]}
        />
        return <StatisticCard
            statistic={{
                title: label || " ",
                value: score?.toFixed(2) || 0,
                suffix: '分',
                description: description || " ",
            }}
            loading={loading}
            chartPlacement="left"
            chart={subRing}
            key={label || " "}
        />
    }

    return <PageContainer>

        <SearchLite
            onSearchAndSubmit={(searchValue) => { getScore(searchValue); setSearchText(searchValue); }}
            databaseMetas={[]}
            onSelectChange={() => { }}
        />

        <ProCard
            title={"选题：" + searchText}
            extra="数据库：国家级大学生创新创业训练项目"
            split='horizontal'
            headerBordered
            bordered
        >
            <ProCard split="vertical">

                <StatisticCard
                    statistic={{
                        value: scoreInfo?.main_score?.toFixed(2) || 0,
                        suffix: '分',
                        title: "总体评分"
                    }}
                    loading={loading}
                    chart={mainGauge}
                />

                <StatisticCard
                    title="维度评分"
                    loading={loading}
                    chart={mainRadar}
                />

            </ProCard>

            <ProCard split="horizontal">
                <ProCard split="vertical">

                    {subCard(
                        scoreInfo?.novelty_score,
                        "新颖性",
                        scoreInfo?.novelty_describe,
                        scoreInfo?.novelty_color,
                    )}

                    {subCard(
                        scoreInfo?.application_score,
                        "应用价值",
                        scoreInfo?.application_describe,
                        scoreInfo?.application_color,
                    )}

                    {subCard(
                        scoreInfo?.academic_score,
                        "学术价值",
                        scoreInfo?.academic_describe,
                        scoreInfo?.academic_color,
                    )}

                </ProCard>
                <ProCard split="vertical">

                    {subCard(
                        scoreInfo?.match_score,
                        "指南匹配度",
                        scoreInfo?.match_describe,
                        scoreInfo?.match_color,
                    )}

                    {subCard(
                        scoreInfo?.trend_score,
                        "趋势表现",
                        scoreInfo?.trend_describe,
                        scoreInfo?.trend_color,
                    )}

                    <ProCard />

                </ProCard>
            </ProCard>
        </ProCard>
    </PageContainer>
}

export default Eval
