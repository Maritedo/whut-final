
from copy import deepcopy
from io import BytesIO
from datetime import datetime

import pandas as pd
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from fastapi import UploadFile
from pydantic import BaseModel
import requests

from ..database.database_meta import DatabaseMeta, DatabaseMetaData
from ..database import ACADEMY_STOP_WORDS


def transform_files_into_data_frame(
    files: list[UploadFile],
) -> pd.DataFrame:

    data_list: list[pd.DataFrame] = []
    for index, file in enumerate(files):
        file_name = file.filename
        file_content = file.file
        try:
            file_content = file.file.read()
            file.file.close()
            # 将内容转换为 BytesIO 对象
            content_stream = BytesIO(file_content)

            if file_name.endswith('.csv'):
                data_ = pd.read_csv(content_stream, dtype=str)
            elif file_name.endswith('.xls') or file_name.endswith('.xlsx'):
                data_ = pd.read_excel(content_stream, dtype=str)
            else:
                raise ValueError(f"第{index + 1}个文件类型有误")
            data_list.append(data_)
        except (
            UnicodeDecodeError, ValueError,  # ParserError
        ) as e:
            raise ValueError(f"第{index + 1}个文件内容不正确: \n{e}")

    data = pd.concat(data_list)
    data = data.drop_duplicates(data.columns)
    return data


def import_data_into_es_from_frame(
    es_client: Elasticsearch,
    database: DatabaseMeta,
    data: pd.DataFrame,
):

    fields = [
        database.title_field, database.time_field
    ] + database.cate_fields + database.id_fields + database.text_fields

    def _actions(df: pd.DataFrame, should_fields: list[str]):

        for _, row in df.iterrows():

            _source = {}
            for field in should_fields:
                if pd.isna(row.get(field, None)):
                    continue
                _source[field] = (
                    str(row[field])
                    .strip()
                    .replace("\n", "")
                    .replace("\t", "")
                )

            yield {
                "_source": _source
            }

    return bulk(
        es_client,
        _actions(data, fields),
        index=database.id,
        raise_on_error=False,
    )


class SearchRequest(BaseModel):
    db_id: str

    terms: list[str] | None = None
    terms_logic: bool = True  # True: and, False: or
    date_range: tuple[int, int] | None = None

    filters: dict[str, list[str]] | None = None
    sub_terms: dict[str, list[str]] | None = None

    page: int | None = None
    page_size: int | None = None


class SearchedData(BaseModel):

    data: list[dict]
    total: int


class TimeSeriesStat(BaseModel):

    dates: list[int]
    values: list[int | float]
    percentages: list[int | float]
    deltas: list[int | float]
    rates: list[int | float]


class TimeSeriesStatPro(TimeSeriesStat):

    min: float
    max: float
    avg: float
    shifts: list[float]


class CatePercent(BaseModel):

    cate: str
    percentage: float
    value: int


class CoOccurrence(BaseModel):
    nodeMinMax: tuple[int, int]
    edgeMinMax: tuple[int, int]
    nodes: list[dict]
    edges: list[dict]


class EvalScores(BaseModel):
    novelty_score: float
    academic_score: float
    application_score: float
    trend_score: float
    match_score: float


class EvalDetails(EvalScores):
    main_score: float | int
    main_describe: str
    novelty_describe: str
    novelty_color: str
    match_describe: str
    match_color: str
    trend_describe: str
    trend_color: str
    application_describe: str
    application_color: str
    academic_describe: str
    academic_color: str

    @staticmethod
    def map_score_to_color(score: float):
        if score < 65:
            return '#a6b8f9'
        elif score < 80:
            return '#869dfb'
        elif score < 90:
            return '#6581FD'
        else:
            return '#4466ff'

    @staticmethod
    def map_main_describe(score: float):
        if score < 65:
            return '建议考虑'
        elif score < 80:
            return '一般'
        elif score < 90:
            return '良好'
        else:
            return '很好'

    @staticmethod
    def map_describe(score: float, category: str):
        descriptions = {
            'novelty': [
                '该选题新颖性较低，与现有的研究项目内容重复较多，建议重新考虑其独特性。',
                '该选题新颖性一般，大部分研究内容与已经立项的项目相似。',
                '该选题新颖性良好，提出了一些新的观点或方法，但在已立项的项目中已有初步的探讨。',
                '该选题新颖性很好，展示了独特的研究方向和未被广泛探讨的问题。'
            ],
            'academic': [
                '该选题学术价值较低，可能不足以支撑一项有影响力的学术研究。',
                '该选题学术价值一般，对学科的贡献有限。',
                '该选题学术价值较高，可为学科领域增添有价值的见解和数据。',
                '该选题学术价值很高，能够显著推动学科发展，为学术界提供重要的理论或实证贡献。'
            ],
            'application': [
                '该选题应用价值较低，实际应用中可能面临较大的障碍或风险。',
                '该选题应用价值一般，实用性和市场潜力有限，或存在一定的转换困难。',
                '该选题具有较好的应用前景，可能在特定领域或市场中得到实用化。',
                '该选题应用价值很高，预期能在工业界和行业应用中产生显著效益和广泛影响。'
            ],
            'match': [
                '该选题与当前资助指南匹配度较低，可能需要调整以更好地符合指导方针。',
                '该选题与相关资助指南匹配度一般，存在部分偏差，可能会影响到立项成功率。',
                '该选题与相关资助指南较好地匹配，部分符合研究方向。',
                '该选题与相关资助指南高度匹配，完全符合当前研究和发展的方向。'
            ],
            'trend': [
                '该选题可能落后于当前基金立项的趋势，需要更新以增大立项概率。',
                '该选题在近年的立项趋势中表现平平，未能显著突出。',
                '该选题跟随相关领域立项的现有趋势，保持行业标准。',
                '该选题处于科研领域的前沿，紧跟最新趋势，有望引领未来发展。'
            ]
        }
        index = 0 if score < 65 else 1 if score < 80 else 2 if score < 90 else 3
        return descriptions[category][index]

    @staticmethod
    def get_details_from(scores: EvalScores) -> "EvalDetails":
        main_score = (scores.novelty_score + scores.academic_score +
                      scores.application_score + scores.trend_score + scores.match_score) / 5
        return EvalDetails(
            main_score=main_score,
            main_describe=EvalDetails.map_main_describe(main_score),
            novelty_describe=EvalDetails.map_describe(
                scores.novelty_score, 'novelty'),
            novelty_color=EvalDetails.map_score_to_color(scores.novelty_score),
            match_describe=EvalDetails.map_describe(
                scores.match_score, 'match'),
            match_color=EvalDetails.map_score_to_color(scores.match_score),
            trend_describe=EvalDetails.map_describe(
                scores.trend_score, 'trend'),
            trend_color=EvalDetails.map_score_to_color(scores.trend_score),
            application_describe=EvalDetails.map_describe(
                scores.application_score, 'application'),
            application_color=EvalDetails.map_score_to_color(
                scores.application_score),
            academic_describe=EvalDetails.map_describe(
                scores.academic_score, 'academic'),
            academic_color=EvalDetails.map_score_to_color(
                scores.academic_score),
            **scores.model_dump(),
        )


class EsSearchQuery:

    def __init__(self, s_request: SearchRequest, database_meta_db: DatabaseMetaData) -> None:

        # 查询数据库元数据
        self.database = database_meta_db.get_database_meta(s_request.db_id)

        self.request = s_request
        self.page_size = s_request.page_size
        self.page = s_request.page

        # 构造query，用于后续查询
        self.query = {
            "bool": {
                "filter": [],
                "must": [],
                "should": [],
            }
        }

        if terms := s_request.terms:
            terms_query = [
                {"wildcard": {f"{self.database.title_field}.like": f"*{term}*"}}
                for term in terms
            ]
            if s_request.terms_logic:  # logic True is and
                self.query["bool"]["filter"].append({
                    "bool": {"must": terms_query}
                })
            else:  # logic False is or
                self.query["bool"]["filter"].append({
                    "bool": {"should": terms_query}
                })

        if date_range := s_request.date_range:
            start_date = datetime(date_range[0], 1, 1)
            end_date = datetime(date_range[1], 12, 31)
            self.query["bool"]["filter"].append({
                "range": {
                    self.database.time_field: {
                        "gte": start_date.strftime('%Y-%m-%d'),
                        "lte": end_date.strftime('%Y-%m-%d'),
                    }
                }
            })

        if filters := s_request.filters:
            for field, values in filters.items():
                field_or = [
                    {"term": {field: value}}
                    for value in values
                ]
                self.query["bool"]["filter"].append({
                    "bool": {"should": field_or}
                })

        if sub_terms := s_request.sub_terms:
            for field, values in sub_terms.items():
                field_or = [
                    {"wildcard": {f"{field}": f"*{value}*"}}
                    for value in values
                ]
                self.query["bool"]["filter"].append({
                    "bool": {"must": field_or}
                })

        self.trend_aggs = {
            "by_year": {
                "date_histogram": {
                    "field": self.database.time_field,
                    "calendar_interval": "year",
                    "format": "yyyy"
                }
            }
        }

    @property
    def query_without_time(self) -> dict:
        """去除查询中的日期过滤器，返回一个新的查询"""
        _query = deepcopy(self.query)
        for i, filter_ in enumerate(_query["bool"]["filter"]):
            if filter_.get("range", None) is not None:
                del _query["bool"]["filter"][i]
                break
        return _query

    @staticmethod
    def new_query_with_terms(
        terms: list[str],
        s_request: SearchRequest,
        database_meta_db: DatabaseMetaData
    ):
        s_request.terms = terms
        return EsSearchQuery(s_request, database_meta_db)

    def get_search_list(self, es_client: Elasticsearch, ) -> list[dict]:

        size = self.page_size if self.page_size else 10
        page = self.page if self.page else 1

        res: list= es_client.search(
            index=self.database.id,
            query=self.query,
            size=size,
            from_=size * (page - 1),
            sort=[
                {
                    self.database.time_field: {
                        "order": "desc"  # 设置为降序
                    }
                }
            ]
        )["hits"]
 

        return SearchedData(
            data=[x["_source"] for x in res["hits"]],
            total=res['total']["value"],
        )

    def get_search_pd(self, es_client: Elasticsearch, columns: list[str]) -> pd.DataFrame:
        # Initialize the scroll
        page_size = 1000
        data = []

        res = es_client.search(
            index=self.database.id,
            query=self.query,
            scroll='2m',
            size=page_size,
            _source=columns
        )

        scroll_id = res['_scroll_id']
        hits = res['hits']['hits']
        data.extend([hit['_source'] for hit in hits])

        # Keep scrolling until no more hits are returned
        while len(hits) > 0:
            res = es_client.scroll(scroll_id=scroll_id, scroll='2m')
            scroll_id = res['_scroll_id']
            hits = res['hits']['hits']
            data.extend([hit['_source'] for hit in hits])

        # Convert to DataFrame
        df = pd.DataFrame(data, columns=columns)
        return df

    def get_new_words_list(
        self,
        es_client: Elasticsearch,
        limit=10,
        start=None,
    ) -> list[str]:

        # 获取与处理参数
        now = int(datetime.now().strftime("%Y"))
        start = start if start else now - 3

        new_query = deepcopy(self.query)
        old_query = deepcopy(self.query)
        start_date = datetime(start, 1, 1)
        end_date = datetime(now, 12, 31)

        # 限制时间
        for i, filter_ in enumerate(self.query["bool"]["filter"]):
            if filter_.get("range", None) is not None:
                new_query["bool"]["filter"][i] = {
                    "range": {
                        self.database.time_field: {
                            "gte": start_date.strftime('%Y-%m-%d'),
                            "lte": end_date.strftime('%Y-%m-%d'),
                        }
                    }
                }
                old_query["bool"]["filter"][i] = {
                    "range": {
                        self.database.time_field: {
                            "lte": start_date.strftime('%Y-%m-%d')
                        }
                    }
                }
                break
        else:
            new_query["bool"]["filter"].append({
                "range": {
                    self.database.time_field: {
                        "gte": start_date.strftime('%Y-%m-%d'),
                        "lte": end_date.strftime('%Y-%m-%d'),
                    }
                }
            })
            old_query["bool"]["filter"].append({
                "range": {
                    self.database.time_field: {
                        "lte": start_date.strftime('%Y-%m-%d')
                    }
                }
            })
        word_aggs = {"word_aggs": {
            "terms": {
                "field": self.database.title_field,
                "size": limit * 50
            }
        }}
        # 查询es
        es_res = es_client.search(
            index=self.database.id, query=new_query,
            aggs=word_aggs, size=0
        )
        new_words_dict: dict = {
            item["key"]: item["doc_count"] for item in
            self.filter_stop_words_buckets(
                es_res["aggregations"]["word_aggs"]["buckets"], [], limit * 50
            )
        }
        es_res = es_client.search(
            index=self.database.id, query=old_query,
            aggs=word_aggs, size=0
        )
        old_words_dict: dict = {
            item["key"]: item["doc_count"] for item in
            self.filter_stop_words_buckets(
                es_res["aggregations"]["word_aggs"]["buckets"], [], limit * 50
            )
        }

        res = new_words_dict.keys() - old_words_dict.keys()
        res = sorted(
            res, reverse=True,
            key=lambda x: new_words_dict[x]
        )[:limit]

        if "标下" in res:
            res.remove("标下")

        return res

    # TODO: refactor redundancy code of get new query
    def get_hot_words_list(
            self,
            es_client: Elasticsearch,
            limit=10,
            start=None,
    ) -> list[str]:
        new_query = deepcopy(self.query)
        now = int(datetime.now().strftime("%Y"))
        start = start if start else now - 3
        start_date = datetime(start, 1, 1)

        for i, filter_ in enumerate(self.query["bool"]["filter"]):
            if filter_.get("range", None) is not None:
                new_query["bool"]["filter"][i] = {
                    "range": {
                        self.database.time_field: {
                            "gte": start_date.strftime('%Y-%m-%d'),
                        }
                    }
                }
                break
        else:
            new_query["bool"]["filter"].append({
                "range": {
                    self.database.time_field: {
                        "gte": start_date.strftime('%Y-%m-%d'),
                    }
                }
            })

        word_aggs = {"word_aggs": {
            "terms": {
                "field": self.database.title_field,
                "size": limit * 50
            }
        }}

        es_res = es_client.search(
            index=self.database.id, query=new_query,
            aggs=word_aggs, size=0
        )
        new_words_dict: dict = {
            item["key"]: item["doc_count"] for item in
            self.filter_stop_words_buckets(
                es_res["aggregations"]["word_aggs"]["buckets"], [], limit * 50
            )
        }
        res = sorted(
            new_words_dict.keys(), reverse=True,
            key=lambda x: new_words_dict[x]
        )[:limit]

        return res

    def get_vice_trend(self, es_client: Elasticsearch):

        # 查询es
        es_res = es_client.search(
            index=self.database.id, query=self.query_without_time,
            aggs=self.trend_aggs, size=0
        )
        buckets = es_res["aggregations"]["by_year"]["buckets"]

        # 判空，无则返回空
        if not buckets:
            return TimeSeriesStat(
                dates=[],
                values=[],
                percentages=[],
                deltas=[],
                rates=[],
            )

        return self._calculate_time_series(buckets)

    def get_main_trend(self, es_client: Elasticsearch, window=3):
        # 取均线参数
        trend_query = self.query_without_time
        db = self.database

        # 查询es
        es_res = es_client.search(
            index=db.id, query=trend_query,
            aggs=self.trend_aggs, size=0
        )
        buckets = es_res["aggregations"]["by_year"]["buckets"]

        # 判空，无则返回空
        if not buckets:
            return TimeSeriesStatPro(**{
                "dates": [], "values": [],
                "percentages": [],
                "deltas": [], "rates": [],
                "shifts": [],
                "avg": 0, "max": 0, "min": 0
            })

        data = self._calculate_time_series(buckets).model_dump()

        # 计算均线
        shifts = [
            sum(data["values"][i - window:i]) / window
            for i in range(window, len(data["values"]) + 1)
            # length + 1 保证最后一位也取到
        ]  # 滑动窗口，从窗口处开始往前

        # 构造返回值
        data.update({
            "shifts": shifts,
            "avg": sum(data["values"]) / len(data["values"]),
            "max": max(data["values"]),
            "min": min(data["values"]),
        })

        return TimeSeriesStatPro(**data)

    def get_word_cloud(self, es_client: Elasticsearch, limit=200):

        keywords = self.request.terms if self.request.terms else []
        db = self.database

        word_aggs = {"word_aggs": {
            "terms": {
                "field": db.title_field,
                "size": limit * 2
            }
        }}
        es_res = (
            es_client.search(
                index=db.id, query=self.query,
                aggs=word_aggs, size=0
            )
            ["aggregations"]["word_aggs"]["buckets"]
        )
        words_list = self.filter_stop_words_buckets(es_res, keywords, limit)

        return {
            str(item["key"]): int(item["doc_count"])
            for item in words_list
        }

    def get_categories_percent(self, es_client: Elasticsearch, field: str, limit=10):
        """
        根据指定的分类字段聚合查询，并返回总数和比例数据
        """
        # 查询es
        c_aggs = {
            "subject_aggs": {
                "terms": {
                    "field": field,
                    "size": limit
                }
            }
        }
        es_res = es_client.search(
            index=self.database.id, query=self.query,
            aggs=c_aggs, size=0,
        )

        # 获取结果
        total = es_res["hits"]["total"]["value"]
        # 判空与处理
        if total == 0:
            return []

        return [
            CatePercent(
                cate=bucket["key"],
                value=bucket["doc_count"],
                percentage=bucket["doc_count"] / total
            ) for bucket in
            es_res["aggregations"]["subject_aggs"]["buckets"]
        ]

    def get_co_occurrence_data(self, es_client: Elasticsearch, limit=30, depth=3):
        keywords: list[str] = self.request.terms if self.request.terms else []

        target = self.database.title_field

        # 查询中心词的共现词，一级共现词
        word_aggs = {"word_aggs": {
            "terms": {
                "field": target,
                "size": limit * 2
            }
        }}
        rel_words = es_client.search(
            index=self.database.id, query=self.query, aggs=word_aggs
        )['aggregations']['word_aggs']['buckets']
        rel_words = self.filter_stop_words_buckets(
            rel_words, keywords, limit * 2)

        # 判空与处理
        if not rel_words:
            return CoOccurrence(**{
                "nodeMinMax": [0, 0],
                "edgeMinMax": [0, 0],
                "nodes": [],
                "edges": [],
            })

        # 构建共现网络，限制数量
        nodes_d, edges_d = self._get_occurrence_network_bfs(
            [str(w["key"]) for w in rel_words], word_aggs,
            self.query, self.database.id,
            depth=depth, limit=limit, client=es_client
        )
        edges = sorted(edges_d.items(), key=lambda x: x[1], reverse=True)[
            :limit]

        # 仅保留边引用的节点
        words_id_set = set()
        for edge in edges:
            words_id_set.add(tuple(edge[0])[0])
            words_id_set.add(tuple(edge[0])[1])
        nodes = {
            node[1][0]: (node[0], node[1][1])
            for node in nodes_d.items()
            if node[1][0] in words_id_set
        }
        del words_id_set

        def _get_smaller_count(_edge: frozenset):
            _edge = tuple(_edge)
            cnt0, cnt1 = nodes[_edge[0]][-1], nodes[_edge[1]][-1]
            return cnt0 if cnt0 < cnt1 else cnt1

        return CoOccurrence(**{
            "nodeMinMax": [
                min(nodes.values(), key=lambda x: x[-1])[-1],
                max(nodes.values(), key=lambda x: x[-1])[-1]
            ],
            "edgeMinMax": [edges[-1][-1], edges[0][-1]],
            "nodes": [
                {
                    "id": str(id_),  # 词序号
                    "name": item[0],
                    "size": item[-1],  # 词频
                } for id_, item in nodes.items()
            ],
            "edges": [
                {
                    "source": str(tuple(nodes)[0]),  # 词序号连接形成线
                    "target": str(tuple(nodes)[1]),
                    "width": _get_smaller_count(nodes),
                } for nodes, width in edges
            ],
        })

    @staticmethod
    def _calculate_time_series(year_agg_buckets: list) -> TimeSeriesStat:

        _dates = [
            int(item["key_as_string"])
            for item in year_agg_buckets
        ]
        _values = [
            item["doc_count"]
            for item in year_agg_buckets
        ]
        dates = []
        values = []

        # 没有数据的年份设置为0
        # 按照顺序生成年份
        for date in range(min(_dates), max(_dates) + 1):
            dates.append(date)
            try:
                value = _values[_dates.index(date)]
            except ValueError:
                value = 0
            values.append(value)

        # 计算各个相邻年份之间的差和百分比
        # 第 0 年没有前一年，故长度少 1
        # 计算最近一年与前面每一年的涨幅
        deltas = []
        percentages = []
        rates = []
        for i in range(len(values) - 1):  # 排除自己减自己，即最后一位
            if values[i] == 0:
                percentage = 1
                rate = 1
                delta = values[i + 1]
            else:
                percentage = values[-1] / values[i] - 1
                rate = values[i + 1] / values[i] - 1
                delta = values[i + 1] - values[i]
            percentages.append(percentage)
            deltas.append(delta)
            rates.append(rate)

        return TimeSeriesStat(
            dates=dates,
            values=values,
            percentages=percentages,
            deltas=deltas,
            rates=rates,
        )

    @staticmethod
    def filter_stop_words_buckets(
            buckets: list[dict[str, dict]],
            these: list[str],
            limit: int = 10,
    ) -> list[dict[str, dict]]:
        """
            用于筛选ES词语聚集查询结果中的学术停用词与查询词本身
            返回结果与ES的buckets的格式相同
            buckets: list[dict[str, int]], es查询结果的buckets
            these:str, 查询用的关键词，用于排除本身。如为空，则不排除
            limit: int = 10, 返回的长度限制
        """

        words_list = []
        for word_item in buckets:
            # 学术停用词和检索词本身
            words_ext = these + ACADEMY_STOP_WORDS

            if len(word_item["key"]) < 2:  # 太短的不要
                continue
            if word_item["key"] in words_ext:
                continue  # 查看下一个词

            words_list.append(word_item)
            if len(words_list) >= limit:
                return words_list  # 词数够了就可以返回了
        return words_list

    def update_text_embedding(self, es_client: Elasticsearch):

        def get_text_list(hits):
            text_list = []
            for hit in hits:
                for field in fields_will_embedding:
                    text_list.append(hit["_source"].get(field, ""))
            return text_list

        def get_embedding_list(text_list) -> list[list[float]]:
            res = requests.post(
                "http://127.0.0.1:8002/embedding/text-list",
                json={"ls": text_list}
            )
            return res.json()

        db = self.database
        fields_will_embedding = [db.title_field]  # + db.text_fields

        # 筛选 is_embedded 字段不是 true 的文档
        query = {
            "bool": {
                "must_not": [
                    {"term": {"is_embedded": True}}
                ]
            }
        }

        page = es_client.search(
            index=db.id,
            body={"query": query},
            size=200,
            scroll="10m"
        )
        scroll_id = page['_scroll_id']
        hits = page['hits']['hits']

        while hits:
            text_list = get_text_list(hits)
            embedding_list = get_embedding_list(text_list)

            bulk_body = []
            for i, hit in enumerate(hits):
                update_actions = {
                    "update": {
                        "_id": hit["_id"],
                        "_index": db.id
                    }
                }
                fields_to_update = {
                    "is_embedded": True  # 更新 is_embedded 标记
                }
                for j, field in enumerate(fields_will_embedding):
                    embedding_index = i * len(fields_will_embedding) + j
                    fields_to_update[f"{field}_embedding"] = embedding_list[embedding_index]
                doc = {
                    "doc": fields_to_update
                }
                bulk_body.extend([update_actions, doc])

            es_client.bulk(body=bulk_body)

            page = es_client.scroll(scroll_id=scroll_id, scroll='10m')
            scroll_id = page['_scroll_id']
            hits = page['hits']['hits']

            del bulk_body
            del text_list
            del embedding_list

    def _get_occurrence_network_bfs(
            self,
            seed_words: list[str],
            aggs: dict,
            query: dict,
            from_: str,
            depth: int = 3,
            limit: int = 30,
            *,
            client: Elasticsearch,
    ) -> tuple[dict[str, tuple[int, int]], dict[frozenset[int], int]]:
        """
        根据初始词，使用广度优先搜索的方式构建共现网络
        params:
            seed_words: list 第一层查询的词
            aggs: dict 聚合计数的方式，聚合名称需要是“word_aggs”
            query: dict 基础的筛选条件
            from_: str 查询的数据库
            depth: int 广度优先搜索的深度 默认为3层
            client: elasticsearch client
        returns: tuple[list, list]
            nodes: dict 节点映射，映射为【词：（节点id，计数）】
            edges: dict 边映射，映射为【（节点1id，节点2id）：计数】
        """
        nodes, edges = {}, {}
        words = deepcopy(seed_words)
        id_cnt = 1
        while depth > 0:
            # 广度查询
            for word in words:
                _query = self._add_keywords_wildcard([word], query)
                response = client.search(
                    index=from_, size=0, aggs=aggs, query=_query,
                )
                word_buckets = EsSearchQuery.filter_stop_words_buckets(
                    response['aggregations']['word_aggs']['buckets'],
                    [word], limit
                )
                # 有节点则id不变；没节点则顺序加id，旧计数设为0
                id_, old_count = nodes.get(word, (id_cnt, 0))
                if old_count == 0:  # 新出现的节点
                    id_cnt += 1
                    nodes[word] = (int(id_), 10)
                # 计算id，存储数据
                _words = []
                for bucket in word_buckets:
                    node = str(bucket["key"])
                    new_count = int(bucket["doc_count"])
                    # 有节点则id不变；没节点则顺序加id，旧计数设为0
                    id_, old_count = nodes.get(node, (id_cnt, 0))
                    if old_count == 0:  # 新出现的节点
                        id_cnt += 1
                    if old_count < new_count:
                        nodes[node] = (int(id_), new_count)
                    edge = frozenset((id_, nodes[word][0]))
                    if len(edge) != 2:
                        continue
                    if edge not in edges:
                        edges[edge] = new_count
                    _words.append(node)
                words = _words
            depth -= 1
        return nodes, edges

    def _add_keywords_wildcard(self, keywords: list[str], query_: dict) -> dict:
        query = deepcopy(query_)
        wildcard_list = []

        # 清除原查询中的条件，并记录
        for i, filter_ in enumerate(query["bool"]["filter"]):
            try:
                wildcard_list = filter_["bool"]["must"]
                del query["bool"]["filter"][i]
                break
            except KeyError:
                continue

        # 构建新的查询，在原生查询上添加新关键词
        wildcard_list.extend(
            {"wildcard": {f"{self.database.title_field}.like": f"*{keyword}*"}}
            for keyword in keywords
        )
        query["bool"]["filter"].append({
            "bool": {"must": wildcard_list}
        })

        return query


class WordXY(BaseModel):
    word: str
    x: float
    y: float
    sim: float
