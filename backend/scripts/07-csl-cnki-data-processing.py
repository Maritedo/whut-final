
import json
import unicodedata
import sys

import pandas as pd
import numpy as np

csl_path: str
cnki_path: str

dates = [f"20{x}-10-20" for x in range(10, 24) ]

def remove_illegal_chars(s):
    if isinstance(s, str):
        return ''.join(c for c in s if unicodedata.category(c)[0] != 'C')
    return s


def read_csl_data(path: str) -> pd.DataFrame:
    csl_data = pd.read_table(path, header=None)
    csl_data = csl_data.rename(
        columns={
            i: k for i, k in enumerate([
                "标题", "摘要", "关键词", "学科", "分类"
            ])
        },
    )
    # 清理数据中的非法字符
    csl_data = csl_data.applymap(remove_illegal_chars)
    csl_data["日期"] = np.random.choice(dates, size=len(csl_data), replace=True)
    return csl_data


def read_cnki_data(path: str) -> pd.DataFrame:
    cnki_dict: dict = json.load(open(path, "r", encoding="utf-8"))
    cnki_df = pd.DataFrame(cnki_dict.values())
    cnki_df = cnki_df.rename(columns={
        "title": "标题",
        "keywords": "关键词",
        "abstract": "摘要",
        "authors": "第一作者",
        "journal": "期刊名",
        "schools": "单位",
        "date": "日期",
    })
    cnki_df["第一单位"] = cnki_df["单位"].apply(lambda x: sorted(x, key=len)[0] if len(x) > 0 else "")
    cnki_df["关键词"] = cnki_df["关键词"].apply(lambda x: ", ".join(x))
    cnki_df["单位"] = cnki_df["单位"].apply(lambda x: ", ".join(x))
    cnki_df["第一作者"] = cnki_df["第一作者"].apply(lambda x: x[0] if len(x)> 0 else "")
    return cnki_df


csl_path = sys.argv[1]
cnki_path = sys.argv[2]
tgt_dir = sys.argv[3]

print(csl_path, cnki_path, tgt_dir)

# read_csl_data(csl_path).to_excel(tgt_dir + "csl.xlsx", index=False)
read_cnki_data(cnki_path).to_excel(tgt_dir + "cnki.xlsx", index=False)
