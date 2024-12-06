import React, { useState, useEffect } from "react";
import { Col, Form, FormInstance, Input, InputNumber, Radio, Row, Select, Slider, SliderSingleProps } from "antd";
import StandardFormRow from "./StandardFormRow";
import TagSelect from "./TagSelect";
import { useRequest } from "@umijs/max";
import { getDbDetailApiDbDetailGet } from "@/services/ant-design-pro/getDbDetailApiDbDetailGet";
import FormItem from "antd/es/form/FormItem";


type tEvent = React.ChangeEvent<HTMLInputElement> |
    React.MouseEvent<HTMLElement> |
    React.KeyboardEvent<HTMLInputElement> | undefined;

type tInfo = { source?: 'clear' | 'input'; } | undefined

interface SearchComplexProps {
    onSearchAndSubmit: (
        searchValue: string,
        formData: API.SearchRequest,
        formInstance: FormInstance<any>,
        event?: tEvent,
        info?: tInfo,
        currentDbMeta?: API.DatabaseMetaOutput,
    ) => void;
    databaseMetas: API.DatabaseMetaOutput[]
}

const dbDetail: API.DatabaseMetaOutput = {
    id: "65e94e64-e526-4298-981b-8168eb142605",
    name: "国家级大学生创新创业训练项目",
    user_id: "",
    create_time: "",
    org_name: "",
    title_field: "",
    time_field: "",
    cate_fields: [],
    id_fields: [],
    text_fields: [],
    user_name: ""
}


const SearchComplex: React.FC<SearchComplexProps> = (props) => {

    const [selectOptions, setSelectOptions] = useState<{ label: string, value: string }[]>([]);
    const [selectedDbId, setSelectedDbId] = useState<string>(dbDetail.id);
    // TODO: remove vars about default select value.

    const { run: fetchDbDetails } = useRequest(getDbDetailApiDbDetailGet, {
        manual: true,
        onSuccess: (data) => {
            renderCateFieldsTagSelects(data);
            renderOtherFieldsText(data);
            renderDateRangeSlider(data);
        }
    });

    useEffect(() => {
        const databaseMetas = props.databaseMetas.length !== 0 ? props.databaseMetas : [dbDetail];

        setSelectedDbId(databaseMetas[0].id);
        setSelectOptions(databaseMetas.map(
            (meta) => ({ label: meta.name, value: meta.id })
        ));
        fetchDbDetails({ db_id: databaseMetas[0].id });

    }, [props.databaseMetas]);

    const handleDbSelectChange = (value: string) => {
        setSelectedDbId(value);
        fetchDbDetails({ db_id: value });
    };

    const [cateFieldsTagSelects, setCateFieldsTagSelects] = useState<React.ReactNode[]>([]);
    const [otherFieldsTexts, setOtherFieldsTexts] = useState<React.ReactNode[]>([]);
    const [dateRangeSlider, setDateRangeSlider] = useState<React.ReactNode>();
    const [dateRange, setDateRange] = useState<number[]>([]);

    const renderCateFieldsTagSelects = (detail: API.DatabaseMetaDetail) => {
        const nodes = [];
        for (const field_name in detail?.cate_fields_detail) {
            const categoryOptions = detail?.cate_fields_detail[field_name];
            nodes.push(
                <StandardFormRow key={field_name} title={field_name} block
                    style={{ padding: 0, marginTop: 0, marginBottom: 3 }}>
                    <FormItem name={`cateField-${field_name}`}
                        style={{ padding: 0, marginTop: 0, marginBottom: 3 }}>
                        <TagSelect expandable>
                            {categoryOptions.map((category: string) => (
                                <TagSelect.Option value={category} key={category}>
                                    {category}
                                </TagSelect.Option>
                            ))}
                        </TagSelect>
                    </FormItem>
                </StandardFormRow>
            );
        }
        setCateFieldsTagSelects(nodes);
    };

    const renderOtherFieldsText = (detail: API.DatabaseMetaDetail) => {

        const genNode = (fieldCate: string, field_name: string) => {
            return <FormItem
                name={`${fieldCate}-${field_name}`}
                label={field_name}
                style={{ marginBottom: 3 }}
                // see: https://sentry.io/answers/unique-key-prop/
                key={field_name}
            >
                <Input size="small" style={{ width: '80%' }} />
            </FormItem>
        }

        let nodes: React.ReactNode[] = [];

        nodes = nodes.concat(detail?.id_fields.map((field_name) => {
            return genNode("idField", field_name);
        }));
        nodes = nodes.concat(detail?.text_fields.map((field_name) => {
            return genNode("textField", field_name);
        }));

        setOtherFieldsTexts(nodes);
    };

    const renderDateRangeSlider = (detail: API.DatabaseMetaDetail) => {


        const marks: SliderSingleProps['marks'] = detail?.date_range
            ? new Array(detail.date_range[1] - detail.date_range[0] + 1).fill(0).reduce((acc, _, i) => {
                const value = i + detail.date_range![0];
                acc[value] = value.toString();
                return acc;
            }, {})
            : {};

        setDateRangeSlider(
            <>
                {/* <InputNumber
                    value={dateRange[0]}
                    onChange={(value)=>{
                        if (value) {
                            setDateRange([value, dateRange[1]]);
                        }
                    }}
                />
                <InputNumber
                    value={dateRange[1]}
                    onChange={(value)=>{
                        if (value) {
                            setDateRange([dateRange[0], value]);
                        }
                    }}
                /> */}
                <FormItem
                    name="date_range"
                    label="时间范围"
                >
                    <Slider
                        range={{ draggableTrack: true }}
                        min={detail?.date_range ? detail?.date_range[0] : undefined}
                        max={detail?.date_range ? detail?.date_range[1] : undefined}
                        step={1}
                        value={dateRange}
                        onChange={(value: number[]) => {
                            setDateRange(value);
                        }}
                        marks={marks}
                    />
                </FormItem>
            </>

        )
    };

    const [form] = Form.useForm();
    const pairs = new Map<string, string>(Object.entries({
        "cateField": "filters",
        "idField": "sub_terms",
        "textField": "sub_terms",
    }));
    const extractCombinedToNestedObj = (
        prefixTargetPairs: Map<string, string>,
        data: object,
    ) => {
        const res: any = {};
        for (const [key, value] of Object.entries(data)) {
            // Split key into prefix and realKey using the '-' delimiter
            const [prefix, realKey] = key.split('-');
            // Find the corresponding target based on the prefix
            const target = prefixTargetPairs.get(prefix);
            if (target != undefined) {
                // If the target does not exist in res, initialize it as an empty object
                if (!res[target]) {
                    res[target] = {};
                }
                // Assign the value to the correct target and realKey;
                if (typeof value === "string") {
                    res[target][realKey] = value.split(" ");
                } else if (value instanceof Array) {
                    res[target][realKey] = value;
                }

            }
        }
        return res;
    };
    const searchToSubmit = (value: string, event: tEvent, info: tInfo) => {
        const formData = form.getFieldsValue(true);
        const nestedData = extractCombinedToNestedObj(pairs, formData)
        const searchRequest: API.SearchRequest = {
            terms: formData["terms"] ? (formData["terms"] as string).split(" ") : null,
            db_id: formData["db_id"],
            filters: nestedData["filters"] || null,
            sub_terms: nestedData["sub_terms"] || null,
            date_range: formData["date_range"] || null,
            page: null,
            page_size: null,
            terms_logic: formData["terms_logic"],
        }
        const databaseMeta = props.databaseMetas.find(
            meta => meta.id === searchRequest.db_id
        );
        props.onSearchAndSubmit(value, searchRequest, form, event, info, databaseMeta);
    };

    return (
        <Form form={form}>
            <div style={{ textAlign: 'center' }}>
                <Row>

                    <Col span={5} offset={4}>
                        <FormItem name="db_id" initialValue={selectedDbId}>
                            <Select  // FIXME: need to add dynamic default values.
                                // initValue and defaultValue are not working.
                                size="large"
                                value={selectedDbId}
                                options={selectOptions}
                                onChange={handleDbSelectChange}
                            />
                        </FormItem>
                    </Col>

                    <Col span={9}>
                        <FormItem name="terms">
                            <Input.Search
                                placeholder="请输入标题关键词"
                                enterButton="检索"
                                size="large"
                                onSearch={searchToSubmit}
                                style={{ width: '90%' }}
                            />
                        </FormItem>
                    </Col>

                    <Col span={2}>
                        <FormItem name="terms_logic" initialValue={true}>
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value={true}> AND </Radio.Button>
                                <Radio.Button value={false}> OR </Radio.Button>
                            </Radio.Group>
                        </FormItem>
                    </Col>

                </Row>
            </div>

            {dateRangeSlider}

            {cateFieldsTagSelects}

            <Row>{otherFieldsTexts}</Row>

        </Form>

    );
};

export default SearchComplex;
