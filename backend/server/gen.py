
from elasticsearch import Elasticsearch
from fastapi import UploadFile
from pydantic import BaseModel
import requests

# from database.database_meta import DatabaseMetaData


class GenInput(BaseModel):

    major: str = ""
    dir: str = ""
    skills: list[str] = []
    lessons: list[str] = []
    remark: str = ""

    keywords: list[str] = []
    idea: str = []
    ref: UploadFile | None = None


class GenData:
    def __init__(self, inputs: GenInput, client: Elasticsearch) -> None:

        self.client = client

        self.major = inputs.major
        self.dir = inputs.dir
        self.skills = inputs.skills
        self.lessons = inputs.lessons
        self.remark = inputs.remark
        self.keywords = inputs.keywords
        self.idea = inputs.idea
        self.ref = inputs.ref

        remark_embedding = self._get_embedding(self.remark)
        keywords_embedding = self._get_embedding("；".join(self.keywords))

        self.search_results = list(set(
            self._search_title_with_embedding(remark_embedding) if self.remark else [] + 
            self._search_title_with_embedding(keywords_embedding) if self.keywords else [],
        ))

    def gen_prompt(self)->str:
        
        prompt = "选题者信息：\n"

        user_info = f"主修 {self.major}; " if self.major else ""
        user_info += f"{self.dir} 方向; " if self.dir else ""
        user_info += f"熟悉 {','.join(self.skills)}; " if self.skills else ""
        user_info += f"已完成 {','.join(self.lessons)} 的学习; " if self.lessons else ""

        prompt += (user_info + "\n") if user_info else ""

        prompt += f"曾完成 \n{self.remark} 等项目\n\n" if self.remark else ""

        project_idea = f"立项关键词: {';'.join(self.keywords)}\n" if self.keywords else ""
        project_idea += f"初步思路: {self.idea}\n" if self.idea else ""
        project_idea += f"参考文献: {self.file_content}\n" if self.file_content else ""

        prompt += (project_idea + "\n") if project_idea else ""

        prompt += "请大学生科研项目指导专家根据选题人的相关信息和以下往年选题，为学生拟定10个合适的选题。\n\n"

        prompt += "\n".join(self.search_results) + "\n"
        
        prompt += "\n注意：严禁重复往年选题内容，**无需解释拟定选题的理由**，一行一个直接列出选题。\n拟定新的选题："

        return prompt


    @property
    def file_content(self) -> str:
        # return self.file.file.read().decode("utf-8")
        return ""

    def _get_embedding(self, text: str) -> list[float]:
        return requests.get(
            "http://localhost:8002/embedding/text?text="
            + text[:256]
        ).json()

    def _search_title_with_embedding(self, embedding: str, cnt=6) -> list[str]:
        return [
            hit["_source"]["项目名称"] for hit in
            self.client.search(
                index="65e94e64-e526-4298-981b-8168eb142605",
                knn={
                    "field": "项目名称_embedding",
                    "k": 30,
                    "query_vector": embedding,
                    "num_candidates": 50
                },
                size=cnt,
                fields=["项目名称_embedding", "项目名称"]
            )["hits"]["hits"]]
