import {
    PageContainer, ProCard, ProForm, ProFormCheckbox,
    ProFormDatePicker, ProFormDateRangePicker, ProFormInstance,
    ProFormSelect, ProFormText, ProFormTextArea, ProFormUploadDragger, StepsForm
} from "@ant-design/pro-components"
import { useRef, useState } from "react";
import TagGroup from "./Database/tagGroup";
import { Card, Modal } from "antd";
import { BodyGenTopicsApiGenPost, genTopicsApiGenPost } from "@/services/genService";
import { useRequest } from "@umijs/max";



const ConfirmCards = (data: BodyGenTopicsApiGenPost) => {
    return <>

        <Card
            title="个人信息"
        >
            <p><b>专业</b>: {data.major}</p>
            <p><b>研究方向</b>: {data.dir}</p>
            <p><b>技能与兴趣领域</b>: {data.skills?.join("、")}</p>
            <p><b>已修相关课程</b>: {data.lessons?.join("、")}</p>
            <p><b>相关经历</b>:</p>
            {data.remark?.split("\n").map((s) => { return <span key={s}>{s}<br /></span> })}

        </Card>

        <Card
            title="项目想法"
            style={{ marginTop: 20, marginBottom: 20 }}
        >
            <p><b>关键词</b>: {data.keywords?.join("、")}</p>
            <p><b>初步思路</b>: </p>
            <p>{data.idea}</p>
            <p><b>参考资料</b>: {Array.isArray(data.ref) ? data.ref[0].originFileObj.name : null}</p>
        </Card>

    </>
}

const Gen = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<BodyGenTopicsApiGenPost>({ major: "", })

    const { run: runGen, loading, data: topics } = useRequest(
        (body: BodyGenTopicsApiGenPost) => {
            return genTopicsApiGenPost(body);
        },
        {
            manual: true,
        }
    )

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleFinishStep = async (values: BodyGenTopicsApiGenPost) => {
        const data = {
            ...formData,
            ...values,
        };
        setFormData(data);
        return true;
    }

    const handleSubmit = async (values: BodyGenTopicsApiGenPost) => {
        const data = {
            ...formData,
            ref: Array.isArray(formData.ref) ? formData.ref[0].originFileObj : null,
        }
        showModal();
        runGen(data);
    }

    return <PageContainer>

        <StepsForm<BodyGenTopicsApiGenPost>
            onFinish={handleSubmit}
        >

            <StepsForm.StepForm<BodyGenTopicsApiGenPost>
                name="userInfo"
                title="个人信息"
                stepProps={{
                    description: '输入你个人的相关信息',
                }}
                onFinish={handleFinishStep}
            >
                <ProFormText
                    name="major"
                    label="专业"
                    width="md"
                    tooltip="专业全称"
                    placeholder="请输入专业全称"
                    rules={[{ required: true }]}
                />
                <ProFormText
                    name="dir"
                    label="研究方向"
                    width="md"
                    tooltip="研究方向"
                    placeholder="请输入研究方向"
                />

                <ProForm.Item
                    name="skills"
                    label="兴趣领域与技能"
                >
                    <TagGroup />
                </ProForm.Item>

                <ProForm.Item
                    name="lessons"
                    label="所修课程"
                    tooltip="建议仅填写与科研相关的非通识基础课程"
                >
                    <TagGroup />
                </ProForm.Item>

                <ProFormTextArea
                    name="remark"
                    label="相关研究经历"
                    width="lg"
                    tooltip="可以是相关的课程论文、学科竞赛等的标题和内容概括"
                    placeholder="请输入相关经历"
                />

            </StepsForm.StepForm>

            <StepsForm.StepForm<BodyGenTopicsApiGenPost>
                name="projectIdea"
                title="头脑风暴"
                stepProps={{
                    description: '填入关于项目的idea',
                }}
                onFinish={handleFinishStep}
            >

                <ProForm.Item
                    name="keywords"
                    label="你想到的研究关键词"
                >
                    <TagGroup />
                </ProForm.Item>

                <ProFormTextArea
                    name="idea"
                    label="你的一些初步思考"
                    width="lg"
                />

                <ProFormUploadDragger
                    name="ref"
                    label="你参考的文献与资料"
                />
            </StepsForm.StepForm>

            <StepsForm.StepForm
                name="confirm"
                title="信息确认"
                stepProps={{
                    description: '确认信息，立即生成！',
                }}
            >

                {<ConfirmCards {...formData} />}

            </StepsForm.StepForm>

        </StepsForm>

        <Modal title="选题结果" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
            {loading ? <p>正在生成,，请稍等...</p> : <p>已生成 {topics?.length} 个选题</p>}
            <Card loading={loading}>
                {topics?.map((topic) => {
                    return <p key={topic}>{topic}</p>
                })}
            </Card>
        </Modal>


    </PageContainer>
}

export default Gen
