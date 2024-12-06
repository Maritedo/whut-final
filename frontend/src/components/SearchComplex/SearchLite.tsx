import React, { useEffect, useState } from "react";
import { Col, Form, FormInstance, Input, InputNumber, Row, Select, Slider } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useRequest } from "@umijs/max";
import { getDbDetailApiDbDetailGet } from "@/services/ant-design-pro/getDbDetailApiDbDetailGet";


type tEvent = React.ChangeEvent<HTMLInputElement> |
    React.MouseEvent<HTMLElement> |
    React.KeyboardEvent<HTMLInputElement> | undefined;

type tInfo = { source?: 'clear' | 'input'; } | undefined

interface SearchLiteProps {
    onSearchAndSubmit: (
        searchValue: string,
        formData: API.SearchRequest,
        formInstance: FormInstance<any>,
        event?: tEvent,
        info?: tInfo,
        currentDbMeta?: API.DatabaseMetaOutput,
    ) => void;
    databaseMetas: API.DatabaseMetaOutput[];
    onSelectChange: (value: string) => void;
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

const SearchLite: React.FC<SearchLiteProps> = (props) => {

    const [selectOptions, setSelectOptions] = useState<{ label: string, value: string }[]>([]);
    const [selectedDbId, setSelectedDbId] = useState<string>('65e94e64-e526-4298-981b-8168eb142605');
    // TODO: remove vars about default select value.

    const [form] = Form.useForm();

    const { run: fetchDbDetails } = useRequest(getDbDetailApiDbDetailGet, {
        manual: true,
    });

    useEffect(() => {
        const databaseMetas = props.databaseMetas.length !== 0 ? props.databaseMetas : [dbDetail];

        setSelectedDbId(databaseMetas[0].id);
        setSelectOptions(databaseMetas.map(
            (meta) => ({ label: meta.name, value: meta.id })
        ));
        fetchDbDetails({ db_id: databaseMetas[0].id });

    }, [props.databaseMetas]);

    const searchToSubmit = (value: string, event: tEvent, info: tInfo) => {
        const formData = form.getFieldsValue(true);
        const searchRequest: API.SearchRequest = {
            terms: formData["terms"] ? (formData["terms"] as string).split(" ") : null,
            db_id: formData["db_id"],
            filters: null,
            sub_terms: null,
            date_range: null,
            page: null,
            page_size: null,
        }
        const databaseMeta = props.databaseMetas.find(meta => meta.id === searchRequest.db_id);
        props.onSearchAndSubmit(value, searchRequest, form, event, info, databaseMeta);
    };

    const handleSelectChange = (value: string) => {
        setSelectedDbId(value);
        props.onSelectChange(value);
    }

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
                                onChange={handleSelectChange}
                            />
                        </FormItem>
                    </Col>

                    <Col span={11}>
                        <FormItem name="terms">
                            <Input.Search
                                placeholder="请输入"
                                enterButton="检索"
                                size="large"
                                onSearch={searchToSubmit}
                                style={{ width: '90%' }}
                            />
                        </FormItem>
                    </Col>

                </Row>
            </div>
        </Form>

    );
};

export default SearchLite;
