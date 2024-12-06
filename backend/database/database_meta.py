
import datetime
import uuid
from typing import Optional

import pandas as pd
from pydantic import BaseModel
from elasticsearch import BadRequestError, Elasticsearch


from .user import UserData


class DatabaseMetaInput(BaseModel):

    name: str
    org_name: str

    title_field: str
    time_field: str

    cate_fields: list[str]
    id_fields: list[str] = []
    text_fields: list[str] = []


class DatabaseMetaOutput(BaseModel):

    id: str
    user_id: str
    create_time: str

    name: str
    org_name: str

    title_field: str
    time_field: str

    cate_fields: list[str]
    id_fields: list[str]
    text_fields: list[str]

    user_name: str


class DatabaseMetaDetail(BaseModel):

    id: str
    name: str

    title_field: str
    time_field: str

    id_fields: list[str]
    text_fields: list[str]

    cate_fields_detail: dict[str, list[str]]
    date_range: tuple[int, int] | None

    def to_excel_template(self):
        columns = [
            self.title_field, self.time_field
        ] + list(
            self.cate_fields_detail.keys()
        ) + self.id_fields + self.text_fields
        return pd.DataFrame(columns=columns)


class DatabaseMeta(BaseModel):

    id: str
    user_id: str
    create_time: str

    name: str
    org_name: str

    title_field: str
    time_field: str

    cate_fields: list[str]
    id_fields: list[str]
    text_fields: list[str]


class DatabaseMetaData:

    def __init__(self, client: Elasticsearch, user_db: UserData) -> None:
        self.client = client
        self.index = "server-database-meta"
        self.user_db = user_db

    def create_database_meta(self, database_meta: DatabaseMetaInput, user_id: str) -> DatabaseMeta:
        database_meta_dict = database_meta.model_dump()
        database_meta_dict["create_time"] = str(
            datetime.datetime.now().strftime("%Y-%m-%d")
        )
        database_meta_dict["id"] = str(uuid.uuid4())
        database_meta_dict["user_id"] = user_id
        self.client.index(
            index=self.index,
            id=database_meta_dict["id"],
            body=database_meta_dict
        )
        return DatabaseMeta(**database_meta_dict)

    def delete_database_meta(self, database_meta_id: str):
        self.client.delete(index=self.index, id=database_meta_id)

    def check_user_is_owner(self, database_meta_id: str, user_id: str) -> bool:
        # database_meta = self.client.get(index=self.index, id=database_meta_id)
        # if database_meta["found"]:
        #     return database_meta["_source"]["user_id"] == user_id
        # return False
        return True

    def list_database_metas(self, org_name: Optional[str]) -> list[DatabaseMeta]:

        # query = {
        #     "bool": {
        #         "should": [
        #             {"bool": {"must_not": {"exists": {"field": "org_name"}}}},
        #             {"term": {"org_name": "public"}}
        #         ],
        #         "minimum_should_match": 1
        #     }
        # }

        # # 如果 org_name 不是 None 或者 "public"，在查询中添加匹配 org_name 的条件
        # if org_name not in [None, "public"]:
        #     query["bool"]["should"].append({"term": {"org_name": org_name}})

        query = {
            "match_all": {}
        }

        metas = [x["_source"] for x in self.client.search(
            index=self.index, body={"query": query}
        )["hits"]["hits"]]

        def add_user_name_into_meta(meta: dict):
            user_id = meta.get("user_id", "")
            user_name = ""
            if user_id != "":
                user_info = self.user_db.get_user_info(user_id)
                user_name = user_info.name
            meta["user_name"] = user_name
            return meta

        metas_output = [
            DatabaseMetaOutput(
                **add_user_name_into_meta(meta)
            ) for meta in metas
        ]

        def default_sort(meta: DatabaseMetaOutput):
            if meta.id == "65e94e64-e526-4298-981b-8168eb142605":
                return 0
            elif meta.id == "a86a6d16-73c0-4f5a-9320-f9334d4f1540":
                return 1
            elif meta.id == "3f64549c-5357-43e9-9e5b-977bf93bde13":
                return 2
            else:
                return 100

        return sorted(metas_output, key=default_sort)

    def create_database(self, meta: DatabaseMeta):

        # 构建es映射
        properties = {
            meta.title_field: {
                "type": "text",
                "search_analyzer": "ik_smart",
                "analyzer": "ik_smart",
                "fielddata": True,
                "fields": {
                    "max": {
                        "type": "text",
                        "search_analyzer": "ik_max_word",
                        "analyzer": "ik_max_word",
                        "fielddata": True
                    },
                    "like": {
                        "type": "wildcard"
                    },
                }
            },
            meta.time_field: {
                "type": "date",
                "format": "yyyy-MM-dd"
            },
            f"{meta.title_field}_embedding": {
                "type": "dense_vector",
                "dims": 1024
            },
            "is_embedded": {
                "type": "boolean"
            }
        }

        for field in meta.cate_fields:
            if field == "":
                continue
            properties[field] = {
                "type": "keyword",
                "doc_values": True,
                "fields": {
                    "search": {
                        "type": "wildcard"
                    }
                }
            }

        for field in meta.id_fields:
            if field == "":
                continue
            properties[field] = {
                "type": "keyword"
            }

        for field in meta.text_fields:
            if field == "":
                continue
            properties[field] = {
                "type": "text",
                "search_analyzer": "ik_smart",
                "analyzer": "ik_smart",
                "fielddata": True,
                "fields": {
                    "max": {
                        "type": "text",
                        "search_analyzer": "ik_max_word",
                        "analyzer": "ik_max_word",
                        "fielddata": True
                    },
                    "like": {
                        "type": "wildcard"
                    }
                }
            }
            properties[f"{field}_embedding"] = {
                "type": "dense_vector",
                "dims": 1024
            }

        # 建表
        es_res = self.client.indices.create(
            index=meta.id,
            mappings={"properties": properties},
        )
        if not es_res.get("acknowledged", False):
            raise BadRequestError

    def delete_database(self, db_id: str):
        self.client.indices.delete(index=db_id)

    def get_database_meta(self, db_id: str) -> DatabaseMeta:
        database_meta = self.client.get(index=self.index, id=db_id)
        if database_meta["found"]:
            return DatabaseMeta(**database_meta["_source"])
        return None

    def get_database_meta_detail(self, db_id: str) -> DatabaseMetaDetail:

        res = self.client.get(index=self.index, id=db_id)
        database_meta = DatabaseMeta(**res["_source"])
        cate_details = {
            cate_filed:
            self._get_field_categories(db_id, cate_filed)
            for cate_filed in database_meta.cate_fields
        }

        # 构建聚合查询
        aggs = {
            "max_year": {
                "max": {
                    "field": database_meta.time_field,
                    "format": "yyyy"  # 使用日期格式化以提取年份
                }
            },
            "min_year": {
                "min": {
                    "field": database_meta.time_field,
                    "format": "yyyy"
                }
            }
        }
        response = self.client.search(index=db_id, size=0, aggs=aggs)

        max_year = response['aggregations']['max_year'].get(
            'value_as_string', None)
        min_year = response['aggregations']['min_year'].get(
            'value_as_string', None)
        date_range = (min_year, max_year) if min_year and max_year else None

        return DatabaseMetaDetail(
            **res["_source"],
            cate_fields_detail=cate_details,
            date_range=date_range,
        )

    def _get_field_categories(
        self, db_id: str, field: str,
        limit: int = 32, order: str = "desc"
    ) -> list[str]:
        es_res = self.client.search(
            index=db_id, size=0,
            aggs={
                "unique": {
                    "terms": {
                        "field": field,
                        "size": limit
                    }
                }
            },
            sort={
                field: {
                    "order": order
                }
            }
        )["aggregations"]["unique"]["buckets"]
        return [category["key"] for category in es_res]

    def upgrade_database_mapping_add_embedding(self, db_id: str):

        meta_hit = self.client.get(index=self.index, id=db_id)
        meta = DatabaseMeta(**meta_hit["_source"])

        add_properties = {
            f"{field}_embedding": {
                "type": "dense_vector",
                "dims": 1024
            } for field in meta.text_fields
        }

        add_properties.update({
            "is_embedded": {
                "type": "boolean"
            },
            f"{meta.title_field}_embedding": {
                "type": "dense_vector",
                "dims": 1024
            },
        })

        self.client.indices.put_mapping(
            index=db_id,
            properties=add_properties
        )
