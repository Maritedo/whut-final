import { useOutletContext } from "@umijs/max";
import Graphin, { Behaviors } from '@antv/graphin';
import { VisContext } from ".";
import { ProCard, StatisticCard } from "@ant-design/pro-components";
import e from "express";
import MicroTrends from "../Welcome/MicroTrends";

const GraphVis = () => {

    const { graphData, trendsGraphData } = useOutletContext<VisContext>();
    const { DragCanvas, ZoomCanvas, DragNode, ActivateRelations } = Behaviors;

    const getLinearMap = (
        v_min: number,
        v_max: number,
        t_min: number,
        t_max: number,
    ) => {
        return (v: number) =>
            t_min + (v - v_min) * (t_max - t_min) / (v_max - v_min)
    }

    const edgeMap = getLinearMap(
        graphData?.edgeMinMax[0] || 0,
        graphData?.edgeMinMax[1] || 1,
        .5, 8
    );

    const nodeMap = getLinearMap(
        graphData?.nodeMinMax[0] || 0,
        graphData?.nodeMinMax[1] || 1,
        30, 70
    );

    const mainGraph = <Graphin
        data={{
            nodes: graphData?.nodes.map(e => ({
                id: e.id,
                style: {
                    keyshape: {
                        size: nodeMap(e.size),
                    },
                    icon: {
                        value: e.name,
                    }
                },
            })) || [],
            edges: graphData?.edges.map(e => ({
                source: e.source,
                target: e.target,
                style: {
                    keyshape: {
                        endArrow: {
                            path: "",
                        },
                        lineWidth: edgeMap(e.width),
                        poly: {
                            distance: 40
                        },
                    },
                },
            })) || [],
        }}
        layout={{ type: 'graphin-force' }}
    >
        <ZoomCanvas disabled />
    </Graphin>

    const subTrends = <MicroTrends
        color='pink'
        dataMap={trendsGraphData || {}}
        limit={8}
    />

    return <ProCard split="vertical">
        <StatisticCard colSpan={16}
            chart={mainGraph}
        />
        <StatisticCard colSpan={8}
            chart={subTrends}
        />
    </ProCard>
}

export default GraphVis;
