
from elasticsearch import Elasticsearch
from concurrent.futures import ThreadPoolExecutor
import queue

new_path = r"C:\Users\realj\Desktop\Projects\AFAS4PI\assets\data\corpus\corpus-new.text"
old_path = r"C:\Users\realj\Desktop\Projects\AFAS4PI\assets\data\corpus\corpus-old.text"

new_file = open(new_path, "a", encoding="utf-8")
old_file = open(old_path, "a", encoding="utf-8")

es = Elasticsearch(hosts="http://localhost:9200")

index = "65e94e64-e526-4298-981b-8168eb142605"

# 创建四个队列
new_queue = queue.Queue()
old_queue = queue.Queue()
new_token_queue = queue.Queue()
old_token_queue = queue.Queue()


def get_query(year: int):
    return {
        "bool": {
            "filter": [
                {
                    "range": {
                        "立项时间": {
                            "gte": f"{year}-01-01",
                            "lte": f"{year}-12-31",
                        }
                    }
                }
            ]
        }
    }

# 用过“生产者-消费者”模型编写异步代码


"""
第一部分的生产者

使用scroll遍历es中符合query的文档，
分别遍历“立项时间”字段2023年，2022年的文档，
并将文档的“项目名称”字段的数据存储在各自多线程共用的数据结构中，

"""


def producer(year, data_queue):
    query = get_query(year)
    scroll = '2m'
    results = es.search(index=index, body={
                        "query": query}, scroll=scroll, size=1000)
    sid = results['_scroll_id']
    scroll_size = len(results['hits']['hits'])

    while scroll_size > 0:
        for hit in results['hits']['hits']:
            data_queue.put(hit['_source']['项目名称'])

        results = es.scroll(scroll_id=sid, scroll=scroll)
        sid = results['_scroll_id']
        scroll_size = len(results['hits']['hits'])

    data_queue.put(None)  # 用None标记生产者结束


"""
第一部分的消费者同时也是第二部分的生产者

同样地创建新旧两个队列，存储分词结果，
分别从第一部分的队列中获取存储的项目名称，
使用"analyzer": "ik_max_word"将项目名称分词，
将分词结果存储
"""


def consumer_producer(data_queue, token_queue):
    while True:
        project_name = data_queue.get()
        if project_name is None:
            token_queue.put(None)  # 向下一个队列传递结束信号
            break
        analysis = es.indices.analyze(
            index=index, body={"text": project_name, "analyzer": "ik_max_word"})
        tokens = [token['token'] for token in analysis['tokens']]
        token_queue.put(' '.join(tokens))


def token_consumer(token_queue, file):
    while True:
        tokens = token_queue.get()
        if tokens is None:
            break
        file.write(tokens + '\n')
    file.close()


# 启动线程
executor = ThreadPoolExecutor(max_workers=8)
executor.submit(producer, 2023, new_queue)
executor.submit(producer, 2022, old_queue)
executor.submit(consumer_producer, new_queue, new_token_queue)
executor.submit(consumer_producer, old_queue, old_token_queue)
executor.submit(token_consumer, new_token_queue, new_file)
executor.submit(token_consumer, old_token_queue, old_file)

# 等待所有任务完成
executor.shutdown(wait=True)
