

from io import StringIO
import logging
from time import sleep

from bs4 import BeautifulSoup
import pandas as pd
import requests

from ..database import ItemDetailMongo, ItemListMongo
from ..crawler.config import ItemDetailCrawlerConfig


target = "http://gjcxcy.bjtu.edu.cn/NewLXItemListForStudentDetail.aspx?ItemNo={}"
headers = {
    "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
}


def crawl(
    logger: logging.Logger,
    conf: ItemDetailCrawlerConfig,
    item_list_mongo: ItemListMongo,
    item_detail_mongo: ItemDetailMongo
):
    next_target = next_target_number_incremental if conf.incremental else next_target_number
    cache = []

    def insert_and_clear_cache():
        logger.info(
            f"insert {len(cache)} items to mongo, start with {cache[0]['number']}.")
        item_detail_mongo.insert_many_items(cache, ordered=False)
        cache.clear()

    def add_placeholder_item(number: str):
        logger.warning(
                f"item number: {number} table not found, cause: {repr(e)}"
        )
        cache.append({
            "number": number,
            "项目名称": "项目未找到",
            "项目简介": target.format(number),
        })

    def handle_unknown_error(e: Exception):
        logger.warning(f"item number: {number} occurred {repr(e)}")
        if len(cache) > 0:
            insert_and_clear_cache()
        sleep(conf.sleep_time)
        raise e

    for number in next_target(item_list_mongo, item_detail_mongo):
        try:
            page_source = get_page_source(number)
            markup_data = parse_markup_data(BeautifulSoup(page_source, "lxml"))
            table_data = parse_table_data(page_source)
            markup_data.update(table_data)
            markup_data["number"] = number
            cache.append(markup_data)
        except ValueError as e:
            add_placeholder_item(number)
        except requests.HTTPError as e:
            if e.response.status_code == 500:
                add_placeholder_item(number)
            else:
                handle_unknown_error(e)
        except Exception as e:
            handle_unknown_error(e)
        if len(cache) >= conf.cache_size:
            insert_and_clear_cache()
    insert_and_clear_cache()


def next_target_number(
    item_list_mongo: ItemListMongo,
    item_detail_mongo: ItemDetailMongo
):
    for item in item_list_mongo.collection.find():
        number = item["number"]
        if not item_detail_mongo.is_number_exist(number):
            yield number


def next_target_number_incremental(
    item_list_mongo: ItemListMongo,
    item_detail_mongo: ItemDetailMongo
):
    pipeline = [
        {  # 将 item_list 集合中的文档与 item_detail 集合进行左外连接
            '$lookup': {
                'from': item_detail_mongo.collection.name,  # 被连接的集合名
                'localField': 'number',  # item_list 集合中用于连接的字段
                'foreignField': 'number',  # item_detail 集合中用于连接的字段
                'as': 'details'  # 连接后的数组字段名
            }
        },
        {  # 筛选出尚未爬取的项目（即 details 数组为空的文档）
            '$match': {
                'details': {'$eq': []}
            }
        },
        {  # 仅保留 number 字段
            '$project': {
                '_id': 0,
                'number': 1
            }
        }
    ]
    cursor = item_list_mongo.collection.aggregate(pipeline)
    for doc in cursor:
        yield doc['number']


def get_page_source(item_no: str):
    for i in range(10):
        response = requests.get(target.format(item_no), headers=headers)
        response.raise_for_status()
        return response.text


def parse_markup_data(soup: BeautifulSoup):
    label_tags = [
        item for item in
        soup.select('div > label > label')
        if (
            "指导教师" not in item.text.strip() and
            "项目成员" not in item.text.strip()
        )
    ]
    value_tags = [
        label.parent.find_next_sibling('div')
        for label in label_tags
    ]
    item_dict = {
        label: value
        for label, value in zip(
            [tag.text.strip() for tag in label_tags],
            [tag.text.strip() for tag in value_tags]
        )
    }
    return item_dict


def parse_members(table: pd.DataFrame):
    return table.to_dict(orient='records')


def parse_teachers(table: pd.DataFrame):
    return table.to_dict(orient='records')


def parse_more_info(table: pd.DataFrame):
    table.iloc[:, 0] = table.iloc[:, 0].str.rstrip('：')
    return table.set_index(table.iloc[:, 0]).iloc[:, 1].to_dict()


def find_value_in_df(targets: list[str], df: pd.DataFrame) -> pd.DataFrame:
    for target in targets:
        for col_index, col in enumerate(df.columns):
            if target in df[col].values:
                row_index = df.index[df[col] == target].tolist()
                return row_index[0], col_index
    raise ValueError(f"targets: {targets} not found.")


def extract_info_table(df: pd.DataFrame, row: int, col: int) -> pd.DataFrame:
    return df.iloc[row:row + 4, col:col + 2]


def parse_table_data(page_source: str):
    try:
        tables = pd.read_html(StringIO(page_source), flavor="lxml")
    except Exception as e:
        logging.warning(f"{repr(e)} occurred while parse_table_data pd.read_html")
        raise ValueError(f"parse_table_data pd.read_html failed, cause: {repr(e)}")
    tables = [table.astype(str).fillna("") for table in tables]

    # https://stackoverflow.com/questions/2052390/manually-raising-throwing-an-exception-in-python
    if len(tables) < 3:
        raise ValueError(f"table length: {len(tables)}, expect 3.")

    if len(tables) == 3:
        return {
            "项目成员": parse_members(tables[0]),
            "指导教师": parse_teachers(tables[1]),
            "项目信息": parse_more_info(tables[2]),
        }

    if len(tables) > 3:
        return {
            "项目成员": parse_members(tables[0]),
            "指导教师": parse_teachers(tables[1]),
            "项目信息": parse_more_info(
                extract_info_table(
                    tables[2],
                    *find_value_in_df(
                        [
                            "负责人曾经参与科研的情况：",
                            "主持人曾经参与科研的情况："
                        ], tables[2])
                )
            ),
        }
