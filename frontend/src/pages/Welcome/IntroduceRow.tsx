import { DatabaseTwoTone, InfoCircleOutlined } from '@ant-design/icons';
import { Area, Column, Treemap } from '@ant-design/charts';
import { Col, Row, Tooltip } from 'antd';
import numeral from 'numeral';
import useStylesB from './style.B';

import { ChartCard, Field } from './Charts';
import Trend from './Trend';

const topColResponsiveProps = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 12,
  xl: 6,
  style: {
    marginBottom: 24,
  },
};

const contentHeight = 80;

interface IntroduceRowProps {
  dbTrend?: API.TimeSeriesStat,
  cateDataA?: API.CatePercent[],
  cateDataB?: API.CatePercent[],
}

const IntroduceRow = ({
  dbTrend,
  cateDataA,
  cateDataB,
}: IntroduceRowProps) => {

  const { styles } = useStylesB();

  const dbTotal = dbTrend?.values.reduce((acc, cur) => acc + cur, 0);
  const dbCurr = dbTrend?.values[dbTrend.values.length - 1];
  const dbPer = dbTrend?.percentages[dbTrend.percentages.length - 1];
  const dbPerFlag = (dbPer || 0) >= 0 ? "up" : "down";

  const dbLineData = dbTrend?.values.map((value, index) => {
    return {
      date: dbTrend?.dates[index],
      value: value,
    }
  });

  const catePerB = (cateDataA && cateDataB) ?
    (cateDataB[1].value - cateDataB[0].value) / cateDataB[0].value
    : 0;

  const cateTreeData = {
    name: "root",
    children: cateDataB?.map((e) => ({ name: e.cate, value: e.value })) || [],
  };

  return (
    <Row gutter={24}>

      <Col {...topColResponsiveProps}>
        <ChartCard
          bordered={false}
          title="数据库数据量"
          action={
            <Tooltip title="指标说明">
              <InfoCircleOutlined />
            </Tooltip>
          }
          loading={dbTrend ? false : true}
          total={`${numeral(dbTotal).format("0,0")} 条`}
          footer={<Field label="当年数据" value={`${numeral(dbCurr).format("0,0")} 条`} />}
          contentHeight={contentHeight}
        >

          <Trend
            flag={dbPerFlag}
            style={{
              marginRight: 16,
              marginTop: 20,
              fontSize: 16,
              textAlign: "right"
            }}
          >
            <span style={{ fontSize: 30 }} > <DatabaseTwoTone /> </span>
            年数据量同比
            <span className={styles.trendText}>{numeral(dbPer).format("0.00") + "%"}</span>
          </Trend>

        </ChartCard>
      </Col>

      <Col {...topColResponsiveProps}>
        <ChartCard
          bordered={false}
          loading={dbTrend ? false : true}
          title="总体立项趋势"
          action={
            <Tooltip title="指标说明">
              <InfoCircleOutlined />
            </Tooltip>
          }
          total={`${numeral(dbCurr).format("0,0")} 条`}
          footer={<Field label="总量" value={`${numeral(dbTotal).format("0,0")} 条`} />}
          contentHeight={contentHeight}
        >
          <Area
            xField="date"
            yField="value"
            shapeField="smooth"
            height={contentHeight}
            axis={false}
            style={{
              fill: 'linear-gradient(-90deg, white 0%, #975FE4 100%)',
              fillOpacity: 0.6,
              width: '100%',
            }}
            padding={-5}
            data={dbLineData}
          />

        </ChartCard>
      </Col>

      <Col {...topColResponsiveProps}>
        <ChartCard
          bordered={false}
          loading={cateDataA ? false : true}
          title="立项类型占比"
          action={
            <Tooltip title="指标说明">
              <InfoCircleOutlined />
            </Tooltip>
          }
          total={numeral(cateDataA ? cateDataA[0].percentage : 0).format("0.00") + " %"}
          footer={
            `${cateDataA ? cateDataA[1].cate : ""} ${numeral(cateDataA ? cateDataA[1].percentage : 0).format("0.00")}% ` +
            ` ${cateDataA ? cateDataA[2]?.cate || "" : ""} ${numeral(cateDataA ? cateDataA[2]?.percentage || 0 : 0).format("0.00")}%`
          }
          contentHeight={contentHeight}
        >
          <Column
            data={cateDataA}
            height={contentHeight}
            padding={-5}
            yField="value" xField="cate"
            axis={false}
          />
        </ChartCard>
      </Col>

      <Col {...topColResponsiveProps}>
        <ChartCard
          loading={cateDataB ? false : true}
          bordered={false}
          title="学科分类占比"
          action={
            <Tooltip title="指标说明">
              <InfoCircleOutlined />
            </Tooltip>
          }
          footer={
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <Trend flag="down">
                第二高与最高相比
                <span className={styles.trendText}> {numeral(catePerB).format("0.00%")} </span>
              </Trend>
            </div>
          }
          total={numeral(cateDataB ? cateDataB[0].percentage : 0).format("0.00") + "%"}
          contentHeight={contentHeight}
        >

          <Treemap
            data={cateTreeData}
            height={contentHeight}
            padding={-5}
            valueField="value"
            // see: https://github.com/ant-design/ant-design-charts/issues/2399#issuecomment-1961023927
            colorField={(d: any) => d.data['group']}
            legend={false}
          />

        </ChartCard>
      </Col>

    </Row>
  );
};
export default IntroduceRow;
