import { ProCard, StatisticCard } from "@ant-design/pro-components"
import { useOutletContext, useRequest } from "@umijs/max"
import { VisContext } from "."
import { WordCloud } from "@ant-design/charts";
import MicroTrends from "../Welcome/MicroTrends";

const HotVis = () => {

    const { cloudData, trendsCloudData } = useOutletContext<VisContext>();



    const mainWordCloud = <WordCloud
        data={cloudData}
        colorField={"text"}
    />

    const subTrends = <MicroTrends
        color='green'
        dataMap={trendsCloudData || {}}
        limit={8}
    />

    return <ProCard split="vertical">
        <StatisticCard colSpan={16}
            chart={mainWordCloud}
        />
        <StatisticCard colSpan={8}
            chart={subTrends}
        />
    </ProCard>
}

export default HotVis
