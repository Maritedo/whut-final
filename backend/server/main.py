
import os
import io
import functools
from typing import Annotated

import dotenv
from fastapi import FastAPI, Cookie, Response, UploadFile, Form
from fastapi.responses import RedirectResponse, StreamingResponse
from pydantic import BaseModel
from pymongo import MongoClient
from elasticsearch import Elasticsearch
from langchain_community.chat_models import QianfanChatEndpoint
from langchain_core.language_models.chat_models import HumanMessage
import requests
import pandas as pd
from urllib.parse import quote

#TODO  增加工作路径
from pathlib import Path
model_dir = Path(__file__).parent.parent
import sys
sys.path.append(str(model_dir))


from gen import GenData, GenInput
from service import (
    CatePercent, EsSearchQuery, EvalDetails, SearchRequest,
    SearchedData, TimeSeriesStat, EvalScores, TimeSeriesStatPro,
    WordXY, CoOccurrence,
    import_data_into_es_from_frame,
    transform_files_into_data_frame,
)

from database.user import UserData, User, UserLoginInput
from database.database_meta import (
    DatabaseMetaData, DatabaseMetaDetail,
    DatabaseMetaInput, DatabaseMetaOutput,
)

dotenv.load_dotenv()

app = FastAPI()
llm = QianfanChatEndpoint(model="ERNIE-3.5-8K")
mongo_client = MongoClient(
    host=os.getenv("MONGO_HOST"),
    port=int(os.getenv("MONGO_PORT"))
)
es_client = Elasticsearch(
    hosts=os.getenv("ES_HOST")
)

user_db = UserData(mongo_client, "final")
database_meta_db = DatabaseMetaData(es_client, user_db)


class ReturnMessage(BaseModel):
    message: str
    status: bool


def check_is_login_decorator(func):
    @functools.wraps(func)
    def wrapper(user_id: Annotated[str, Cookie()] = None, *args, **kwargs):
        # if user_id is None:
        #     return ReturnMessage(message="您还没有登录", status=False)
        # else:
        return func(user_id=user_id, *args, **kwargs)
    return wrapper


@app.get("/api", response_model=ReturnMessage)
def root():
    return ReturnMessage(message="Hello World!", status=True)


def set_user_cookie(user: User, response: Response):
    response.set_cookie(key="user_id", value=user.id)
    response.set_cookie(key="user_name", value=user.name)
    response.set_cookie(key="user_privilege", value=user.privilege)
    response.set_cookie(key="org_name", value=user.org_name)


def clear_user_cookie(response: Response):
    response.delete_cookie(key="user_id")
    response.delete_cookie(key="user_name")
    response.delete_cookie(key="user_privilege")
    response.delete_cookie(key="org_name")


@app.post("/api/user/register", response_model=ReturnMessage)
def register(user: User):
    try:
        user_db.create_user(user)
        return ReturnMessage(message="注册成功", status=True)
    except Exception as e:
        return ReturnMessage(message=repr(e), status=False)


@app.post("/api/user/login", response_model=ReturnMessage)
def login(user: UserLoginInput, response: Response):
    if user_obj := user_db.get_user_info(user.id):
        set_user_cookie(user_obj, response)
        return ReturnMessage(message="登陆成功", status=True)
    else:
        clear_user_cookie(response)
        return ReturnMessage(message="登陆失败", status=False)


@app.get("/api/user/logout", response_model=ReturnMessage)
def logout(response: Response):
    clear_user_cookie(response)
    return ReturnMessage(message="已登出", status=True)


@app.post("/api/db/create", response_model=ReturnMessage)
@check_is_login_decorator
def create_db(inputs: DatabaseMetaInput, user_id: Annotated[str, Cookie()] = None):
    database_meta = database_meta_db.create_database_meta(inputs, user_id)
    database_meta_db.create_database(database_meta)
    return ReturnMessage(message=f"已创建{inputs.name}", status=True)


@app.get("/api/db/list", response_model=list[DatabaseMetaOutput])
def list_db(user_id: Annotated[str, Cookie()] = None):
    if user_id is None:
        return database_meta_db.list_database_metas(None)
    user = user_db.get_user_info(user_id)
    return database_meta_db.list_database_metas(user.org_name)


@app.post("/api/db/delete", response_model=ReturnMessage)
@check_is_login_decorator
def delete_db(db_id: str, user_id: Annotated[str, Cookie()] = None):
    if database_meta_db.check_user_is_owner(db_id, user_id):
        database_meta_db.delete_database_meta(db_id)
        database_meta_db.delete_database(db_id)
        return ReturnMessage(message=f"已删除{db_id}", status=True)
    else:
        return ReturnMessage(message="没有操作权限", status=False)


@app.post("/api/db/import", response_model=ReturnMessage)
def import_data(data_files: list[UploadFile] | UploadFile, db_id: str = Form()):
    database = database_meta_db.get_database_meta(db_id)

    if database is None:
        return ReturnMessage(status=False, message="数据库有误")

    if type(data_files) != list:
        data_files = [data_files]

    try:
        data_frame = transform_files_into_data_frame(data_files)
        s, f = import_data_into_es_from_frame(es_client, database, data_frame)
    except ValueError as e:
        return ReturnMessage(status=False, message=repr(e))
    except KeyError as e:
        return ReturnMessage(status=False, message=f"文件内容不正确: {repr(e)}")

    msg = f"成功导入数据{s}条"
    if f:
        msg += f"，存在以下问题：{f}"

    return ReturnMessage(status=True, message=msg)


@app.get("/api/db/embedding", response_model=ReturnMessage)
def embed_db_text(db_id: str):
    query = EsSearchQuery(SearchRequest(db_id=db_id), database_meta_db)
    query.update_text_embedding(es_client)
    return ReturnMessage(message="ok", status=True)


@app.get("/api/db/detail", response_model=DatabaseMetaDetail)
def get_db_detail(db_id: str):
    return database_meta_db.get_database_meta_detail(db_id)


@app.get("/api/db/import-template", response_class=StreamingResponse)
def get_db_import_template(db_id: str):
    meta_detail = database_meta_db.get_database_meta_detail(db_id)
    df = meta_detail.to_excel_template()
    # 用pandas（已经import成pd了）创建一个没有index的只有标题行的excel文件
    # 返回给浏览器开始下载
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False)
    # 设置文件指针到开头
    output.seek(0)
    file_name = f"{meta_detail.name}-模板.xlsx"
    encoded_file_name = quote(file_name)
    # 返回StreamingResponse，开始下载
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_file_name}"
        }
    )


@app.post("/api/search", response_model=SearchedData)
def get_search_result(s_requests: SearchRequest):
    es_query = EsSearchQuery(s_requests, database_meta_db)
    return es_query.get_search_list(es_client)


@app.post("/api/search/excel", response_class=StreamingResponse)
def get_search_excel(s_requests: SearchRequest):
    es_query = EsSearchQuery(s_requests, database_meta_db)
    meta = database_meta_db.get_database_meta_detail(s_requests.db_id)
    cols = meta.to_excel_template().columns.to_list()
    df = es_query.get_search_pd(es_client, cols)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False)
    file_name = f"{meta.name}-查询结果.xlsx"
    output.seek(0)
    encoded_file_name = quote(file_name)
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_file_name}"
        }
    )


@app.post("/api/charts/vice-trends/new", response_model=dict[str, TimeSeriesStat])
def get_new_trends(s_requests: SearchRequest):
    es_query = EsSearchQuery(s_requests, database_meta_db)
    meta_detail = database_meta_db.get_database_meta_detail(
        es_query.database.id
    )
    new_words_list = es_query.get_new_words_list(
        es_client, start=meta_detail.date_range[1]-3
    )
    return {
        word: EsSearchQuery.new_query_with_terms(
            [word], s_requests, database_meta_db
        ).get_vice_trend(es_client) for word in new_words_list
    }


@app.post("/api/charts/vice-trends/hot", response_model=dict[str, TimeSeriesStat])
def get_hot_trends(s_requests: SearchRequest):
    es_query = EsSearchQuery(s_requests, database_meta_db)
    meta_detail = database_meta_db.get_database_meta_detail(
        es_query.database.id
    )
    new_words_list = es_query.get_hot_words_list(
        es_client, start=meta_detail.date_range[1]-3
    )
    return {
        word: EsSearchQuery.new_query_with_terms(
            [word], s_requests, database_meta_db
        ).get_vice_trend(es_client) for word in new_words_list
    }


@app.post("/api/charts/vice-trends/list", response_model=dict[str, TimeSeriesStat])
def get_trends_list(s_requests: SearchRequest, words: list[str]):
    terms = s_requests.terms if s_requests.terms else []
    return {
        word: EsSearchQuery.new_query_with_terms(
            terms + [word], s_requests, database_meta_db
        ).get_vice_trend(es_client) for word in words
    }


@app.post("/api/charts/vice-trend", response_model=TimeSeriesStat)
def get_vice_trends(s_requests: SearchRequest):
    es_query = EsSearchQuery(s_requests, database_meta_db)
    return es_query.get_vice_trend(es_client)


@app.post("/api/charts/main-trend", response_model=TimeSeriesStatPro)
def get_main_trends(s_requests: SearchRequest):
    es_query = EsSearchQuery(s_requests, database_meta_db)
    return es_query.get_main_trend(es_client)


@app.post("/api/charts/words-cloud", response_model=list[dict])
def get_words_cloud(s_requests: SearchRequest):
    es_query = EsSearchQuery(s_requests, database_meta_db)
    word_cloud_dict = es_query.get_word_cloud(es_client)
    return sorted([
        {
            "text": k,
            "value": v,
        } for k, v in
        word_cloud_dict.items()
    ], key=lambda x: x["value"], reverse=True)


@app.post("/api/charts/categories", response_model=list[CatePercent])
def get_categories_percentage(s_requests: SearchRequest, field: str):
    es_query = EsSearchQuery(s_requests, database_meta_db)
    return es_query.get_categories_percent(es_client, field)


@app.get("/api/maintenance/upgrade-database-mapping-add-embedding", response_model=ReturnMessage)
def upgrade_database_mapping_add_embedding():
    metas = database_meta_db.list_database_metas(None)
    for meta in metas:
        database_meta_db.upgrade_database_mapping_add_embedding(meta.id)
    return ReturnMessage(message="ok", status=True)


@app.get("/api/eval", response_model=EvalDetails)
def get_eval_result(text: str):
    scores = EvalScores(
        **requests.get(
            "http://localhost:8002/eval/scores?text=" + text
        ).json())
    return EvalDetails.get_details_from(scores)


@app.post("/api/gen", response_model=list[str])
def gen_topics(
    major: str = Form(),
    dir: str = Form(""),
    skills: list[str] = Form([]),
    lessons: list[str] = Form([]),
    remark: str = Form(""),
    keywords: list[str] = Form([]),
    idea: str = Form(""),
    ref: UploadFile | None = None,
):
    inputs = GenInput(
        major=major,
        dir=dir,
        skills=skills,
        lessons=lessons,
        remark=remark,
        keywords=keywords,
        idea=idea,
        ref=ref,
    )
    gen = GenData(inputs, es_client)
    prompt = gen.gen_prompt()

    messages = [HumanMessage(content=prompt)]
    content: str = llm.invoke(messages).content

    try:
        return [
            line.split(". ")[1].strip() for line in
            content.split("\n")
        ]
    except Exception as e:
        print(e)
        return gen.search_results


@app.get("/api/charts/rec", response_model=list[WordXY])
def get_rec_words(word: str):
    return RedirectResponse(
        f"http://localhost:8002/charts/words-xy?word={word}"
    )


@app.post("/api/charts/graph", response_model=CoOccurrence)
def get_graph_data(s_requests: SearchRequest):
    es_query = EsSearchQuery(s_requests, database_meta_db)
    return es_query.get_co_occurrence_data(es_client)
