

import React, { useEffect, useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Input, Tag, theme } from 'antd';

interface TagGroupProps {
    value?: string[];
    onChange?: (value: string[]) => void;
}

const TagGroup: React.FC<TagGroupProps> = ({
    value = [],
    onChange,
}) => {

    const { token } = theme.useToken();
    const [tags, setTags] = useState(value);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<InputRef>(null);

    const triggerChange = (changedValue: string[]) => {
        onChange?.(changedValue);
    }

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus();
        }
    }, [inputVisible]);

    const handleClose = (removedTag: string) => {
        const newTags = tags.filter((tag) => tag !== removedTag);
        setTags(newTags);
        triggerChange(newTags);
    };

    const showInput = () => {
        setInputVisible(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputConfirm = () => {
        if (inputValue && tags.indexOf(inputValue) === -1) {
            setTags([...tags, inputValue]);
            triggerChange([...tags, inputValue]);
        }
        setInputVisible(false);
        setInputValue('');
    };

    const forMap = (tag: string) => (
        <span key={tag} style={{ display: 'inline-block' }}>
            <Tag
                closable
                onClose={(e) => {
                    e.preventDefault();
                    handleClose(tag);
                }}
            >
                {tag}
            </Tag>
        </span>
    );

    const tagChild = tags.map(forMap);

    const tagPlusStyle: React.CSSProperties = {
        background: token.colorBgContainer,
        borderStyle: 'dashed',
    };

    return (
        <div style={{ marginBottom: 16 }}>

            {tagChild}

            {inputVisible ? (
                <Input
                    ref={inputRef}
                    type="text"
                    size="small"
                    style={{ width: 78 }}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputConfirm}
                    onPressEnter={handleInputConfirm}
                />
            ) : (
                <Tag onClick={showInput} style={tagPlusStyle}>
                    <PlusOutlined /> 新字段
                </Tag>
            )}
        </div>
    );
};

export default TagGroup;