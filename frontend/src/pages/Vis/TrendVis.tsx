
import { useOutletContext } from "@umijs/max"
import { VisContext } from "."
import { ProCard, StatisticCard } from "@ant-design/pro-components";
import { Bar, Column, Line } from "@ant-design/charts";
import numeral from "numeral";
import ColorData from "@/components/colorData";

const TrendVis = () => {

    const { trendData } = useOutletContext<VisContext>();
    const lineDataBase = trendData?.dates?.map((date, i) => {
        return { date, value: trendData?.values[i], type: "base", size: 3 }
    });
    const lineData = lineDataBase?.concat(
        trendData?.shifts.map((shift, i) => {
            return { date: trendData.dates[i + 2], value: shift, type: "shift", size: 2 }
        }) || []
    );
    const barData = trendData?.dates?.map((date, i) => {
        if (i === 0) return { date, value: 0, trend: "increase" };
        return { date, value: trendData?.deltas[i - 1], trend: (trendData?.deltas[i - 1] > 0) ? "increase" : "decrease" }
    });

    const mainLine = <Line
        data={lineData}
        xField={"date"}
        yField={"value"}
        colorField={"type"}
        sizeField={"size"}
        legend={{ size: false }}
        height={400}
        annotations={[
            {
                type: 'lineY',
                data: [trendData?.avg || 0],
                label: {
                    text: `平均 ${trendData?.avg.toFixed(2) || 0}`,
                    position: 'left',
                    style: { textBaseline: 'bottom' },
                    dx: 20
                },
            }
        ]}
    />

    const subColumn = <Column
        data={barData}
        xField={"date"}
        yField={"value"}
        colorField={"trend"}
        height={250}
        scale={{
            color: {
                domain: ["increase", "decrease"],
                range: ["#FF4646", "#408888"]
            }
        }}
        annotations={[
            {
                type: 'lineY',
                data:  [0],
                style: {
                    lineWidth: 3,
                    stroke: "#000000",
                    opacity: 1,
                }
            }
        ]}
    />

    const currentV = trendData?.values[trendData?.values.length - 1] || 0;
    const delta1 = trendData?.deltas[trendData?.deltas.length - 1] || 0;
    const delta3 = trendData?.deltas.slice(
        trendData?.deltas.length - 2,
        trendData?.deltas.length
    ).reduce((a, b) => a + b, 0) || 0;
    const rate1 = trendData?.rates[trendData.rates.length - 1] || 0;
    const rate3 = trendData?.rates.slice(
        trendData?.rates.length - 2,
        trendData?.rates.length
    ).reduce((a, b) => a + b, 0) || 0;

    const compareToCurrent = (v?: number) => (((v || 0) - currentV) / (v || 0));

    return <>
        <ProCard split="vertical">
            <ProCard split="horizontal" colSpan={16}>

                <StatisticCard
                    chart={mainLine}
                />

                <StatisticCard
                    style={{
                        paddingTop: -20
                    }}
                    chart={subColumn}
                />

            </ProCard>
            <ProCard split="horizontal">

                <ProCard>
                    <div style={{ textAlign: "center", marginBottom: 30, marginTop: 20 }}>
                        <span style={{
                            fontSize: "6.5rem",
                            fontWeight: 100,
                        }}>
                            {numeral(currentV).format("0,0")}
                        </span>
                        <span style={{
                            fontSize: "2rem",
                            fontWeight: 100,
                        }}>
                            &nbsp;  条
                        </span>
                    </div>

                    <p style={{ fontSize: 18 }}>
                        近<b>一年</b>立项数量变化 &nbsp;
                        <ColorData value={delta1} formatStr="+0,0" />
                        &nbsp;，同比变化  &nbsp;
                        <ColorData value={rate1} formatStr="+0.00%" />
                    </p>
                    <p style={{ fontSize: 18, marginBottom: 30 }}>
                        近<b>三年</b>立项数量变化 &nbsp;
                        <ColorData value={delta3} formatStr="+0,0" />
                        &nbsp;，同比变化  &nbsp;
                        <ColorData value={rate3} formatStr="+0.00%" />
                    </p>

                </ProCard>

                <ProCard split="horizontal">
                    <ProCard split="vertical">
                        <StatisticCard
                            title="平均立项数量"
                            statistic={{
                                value: trendData?.avg || 0,
                                precision: 2,
                            }}
                            footer={
                                <p>
                                    与今年立项相比 &nbsp;
                                    <ColorData
                                        value={compareToCurrent(trendData?.avg)}
                                        formatStr="+0.00%"
                                    />
                                </p>
                            }
                        />
                        <StatisticCard
                            title="总立项数量"
                            statistic={{
                                value: trendData?.values.reduce((a, b) => (a + b), 0) || 0,
                                precision: 2,
                            }}
                            footer={
                                <p>
                                    与今年立项相比 &nbsp;
                                    <ColorData
                                        value={compareToCurrent(trendData?.values.reduce((a, b) => (a + b), 0))}
                                        formatStr="+0.00%"
                                    />
                                </p>
                            }
                        />
                    </ProCard>
                    <ProCard split="vertical">
                        <StatisticCard
                            title="一年最大立项数量"
                            statistic={{
                                value: trendData?.max || 0,
                                precision: 2,
                            }}
                            footer={
                                <p>
                                    与今年立项相比 &nbsp;
                                    <ColorData
                                        value={compareToCurrent(trendData?.max)}
                                        formatStr="+0.00%"
                                    />
                                </p>
                            }
                        />
                        <StatisticCard
                            title="一年最小立项数量"
                            statistic={{
                                value: trendData?.min || 0,
                                precision: 2,
                            }}
                            footer={
                                <p>
                                    与今年立项相比 &nbsp;
                                    <ColorData
                                        value={compareToCurrent(trendData?.min)}
                                        formatStr="+0.00%"
                                    />
                                </p>
                            }
                        />
                    </ProCard>
                </ProCard>
            </ProCard>
        </ProCard>
    </>
}

export default TrendVis
