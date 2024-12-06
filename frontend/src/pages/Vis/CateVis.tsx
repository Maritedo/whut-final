import { Pie, Treemap } from "@ant-design/charts"
import { ProCard, StatisticCard } from "@ant-design/pro-components"
import { useOutletContext } from "@umijs/max"
import { VisContext } from ".";

const CateVis = () => {

    const { cateDataA, cateDataB } = useOutletContext<VisContext>();

    const subTreemap = <Treemap
        data={{
            name: "root",
            children: cateDataA?.map((e) => ({ name: e.cate, value: e.value })) || []
        }}
        colorField={(d: any) => d.data['group']}
        valueField="value"
        legend={false}
    />


    const subPie = <Pie
        data={cateDataB || []}
        angleField="value"
        valueField="value"
        colorField="cate"
        label={{
            text: 'cate',
            style: {
                fontWeight: 'bold',
            },
        }}
        innerRadius={0.5}
        legend={{
            color: {
                title: false,
                position: 'right',
                rowPadding: 5,
            },
        }}
        scale={{
            color: {
                palette: "set2"
            }
        }}
    />

    return <ProCard split="vertical">
        <StatisticCard
            chart={subTreemap}
        />
        <StatisticCard
            chart={subPie}
        />
    </ProCard>
}

export default CateVis
