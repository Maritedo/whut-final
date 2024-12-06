import { ProCard, StatisticCard } from "@ant-design/pro-components";
import { useOutletContext } from "@umijs/max";
import { VisContext } from ".";
import { Scatter } from "@ant-design/charts";
import MicroTrends from "../Welcome/MicroTrends";

const RecVis = () => {

    const { recData, trendsRecData } = useOutletContext<VisContext>();

    const mainScatter = <Scatter
        data={recData}
        xField={"x"}
        yField={"y"}
        colorField={"word"}
        sizeField={"sim"}
        scale={{
            x: { nice: true },
            y: { nice: true },
            size: { nice: true },
        }}
        label={{
            text: 'word',
            style: {
                stroke: '#fff',
                textAnchor: 'start',
                textBaseline: 'middle',
                dx: 15,
                position: 'left',
                fontSize: 15,
                lineWidth: 3,
            },
        }}
        legend={false}
    />
    const subTrends = <MicroTrends
        color='purple'
        dataMap={trendsRecData || {}}
        limit={8}
    />

    return <ProCard split="vertical">
        <StatisticCard colSpan={16}
            chart={mainScatter}
        />
        <StatisticCard colSpan={8}
            chart={subTrends}
        />
    </ProCard>
};

export default RecVis;
