from pathlib import Path

import fasttext
import numpy as np
import torch
from elasticsearch import Elasticsearch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.manifold import TSNE
from torch import cuda

model_dir = Path(__file__).parent / 'var'

es_client = Elasticsearch(
    hosts="http://localhost:9200"
)

e5_local = SentenceTransformer(
    str(model_dir / 'multilingual-e5-large-instruct'),
    device='cuda' if cuda.is_available() else 'cpu'
)

embedding_2023 = fasttext.load_model(
    model_dir / 'fasttext-models' / '2023-model.bin'
)

embedding_2022 = fasttext.load_model(
    model_dir / 'fasttext-models' / '2022-model.bin'
)

alignment_matrix: torch.nn.Parameter = torch.load(
    model_dir / 'fasttext-models' / 'alignment_matrix.pt'
)

server = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:8001",
]

server.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextList(BaseModel):
    ls: list[str]


class EvalScores(BaseModel):
    novelty_score: float
    academic_score: float
    application_score: float
    trend_score: float
    match_score: float


def _map_novelty_scores(value: float):
    Q1 = 0.009386032819747925
    Q2 = 0.017434478
    Q3 = 0.033541515469551086
    upper_fence = 0.06977473944425583

    if value >= upper_fence:
        return 98
    elif value <= 0:
        return 65
    elif value == Q1:
        return 75
    elif value == Q2:
        return 85
    elif value == Q3:
        return 90
    else:
        if value < Q1:
            # 在0到Q1之间线性插值映射到65-75
            return 65 + (75 - 65) * (value / Q1)
        elif value < Q2:
            # 在Q1到Q2之间线性插值映射到75-85
            return 75 + (85 - 75) * ((value - Q1) / (Q2 - Q1))
        elif value < Q3:
            # 在Q2到Q3之间线性插值映射到85-90
            return 85 + (90 - 85) * ((value - Q2) / (Q3 - Q2))
        else:
            # 在Q3到上触须之间线性插值映射到90-98
            return 90 + (98 - 90) * ((value - Q3) / (upper_fence - Q3))


def _get_word_novelty(token: str):
    new_repr = torch.tensor(
        embedding_2023.get_word_vector(token),
        dtype=torch.float32,
    )
    old_repr = torch.tensor(
        embedding_2022.get_word_vector(token),
        dtype=torch.float32,
    )
    new_repr_al = torch.matmul(new_repr, alignment_matrix)
    novelty_value = 1 - float(
        torch.cosine_similarity(new_repr_al, old_repr, dim=0).item()
    )
    score = _map_novelty_scores(novelty_value)
    return score


def get_text_novelty(text: str):
    es_res = es_client.indices.analyze(
        text=text,
        tokenizer="ik_max_word",
    )
    tokens = [token["token"] for token in es_res["tokens"]]
    tokens_novelty = [_get_word_novelty(token) for token in tokens]
    novelty_score = ((
                             sum(tokens_novelty) - min(tokens_novelty) - max(tokens_novelty)
                     ) / (
                             len(tokens) - 2
                     ))
    return novelty_score


def _get_text_prompt_cos_sim(prompt: str, text: str):
    embedding = torch.tensor(e5_local.encode(prompt))
    text_embedding = torch.tensor(e5_local.encode(text))
    return float(torch.cosine_similarity(embedding, text_embedding, dim=0).item())


def _map_prompt_scores(value: float):
    if value >= 0.98:
        return 98.
    elif value <= 0.65:
        return 65.
    else:
        return value * 100


def get_text_academic(text: str):
    prompt = "创造高深知识的，具有专业性、风险性、曲折性、连续性和未知性"
    return _map_prompt_scores(_get_text_prompt_cos_sim(prompt, text) + .05)


def get_text_application(text: str):
    prompt = "应用价值高"
    return _map_prompt_scores(_get_text_prompt_cos_sim(prompt, text) + .05)


def _map_match_score(value: float):
    def scale_value(v, A, B, C, D):
        return C + ((D - C) * (v - A) / (B - A))

    if 90 <= value <= 98:
        return scale_value(value, 88, 98, 65, 98)
    elif value < 88:
        return 65.
    else:
        return 98.


def get_text_match(text: str):
    index = "dca9094a-413f-4864-ad99-6d27efb3a12e"
    embedding = e5_local.encode(text)

    knn_query = {
        "field": "标题_embedding",
        "query_vector": embedding,
        "k": 30,
        "num_candidates": 100
    }

    # 执行k-NN查询
    knn_response = es_client.search(
        index=index, size=5, knn=knn_query
    )

    # 计算前五个结果的_score平均值
    scores = [hit['_score'] for hit in knn_response['hits']['hits']]
    if scores:
        average_score = sum(scores) / len(scores)
    else:
        average_score = 0  # 如果没有结果，分数为0

    return _map_match_score(average_score * 100)


def _get_es_knn_scores(text_embedding: list[float], year: int) -> list[float]:
    # 国家级大学生创新创业训练项目
    index = "65e94e64-e526-4298-981b-8168eb142605"
    knn_query = {
        "knn": {
            "field": "项目名称_embedding",
            "query_vector": text_embedding,  # 确保 text_embedding 已经正确生成
            # "k": 30,
            "num_candidates": 100
        }
    }

    filters = {
        "range": {
            "立项时间": {
                "gte": f"{year}-01-01",
                "lte": f"{year}-12-31",
            }
        }
    }

    query = {
        "bool": {
            "must": [
                knn_query
            ],
            "filter": [
                filters
            ]
        }
    }

    knn_response = es_client.search(
        index=index,
        size=50,
        query=query
    )

    return [hit['_score'] for hit in knn_response['hits']['hits']]


def _get_over_threshold_cnt(scores: list[float], threshold: float):
    return sum(1 for score in scores if score > threshold)


def _get_deltas_avg(series: list[float]):
    this = series[1:]
    last = series[:-1]
    deltas = [vt - vl for vt, vl in zip(this, last)]

    return (sum(deltas) + deltas[-1]) / (len(deltas) + 1)


def _map_trend_score(value: float):
    # 检查value是否超出了上界
    if value >= 20:
        return 98.0
    # 检查value是否低于下界
    elif value <= -15:
        return 65.0
    # 处理在区间[-15, 1)内的value
    elif -15 <= value < 1:
        # 应用线性变换公式
        return 1.25 * value + 83.75
    # 处理在区间[1, 20)内的value
    elif 1 <= value < 20:
        # 应用线性变换公式
        return 0.6842 * value + 84.316


def get_text_trend(text: str):
    th = 0.94
    embedding = e5_local.encode(text)
    knn_s_scores = [
        _get_es_knn_scores(embedding, year)
        for year in (2021, 2022, 2023)
    ]
    cnt_s = [
        _get_over_threshold_cnt(knn_scores, th)
        for knn_scores in knn_s_scores
    ]
    return _map_trend_score(_get_deltas_avg(cnt_s))


@server.get('/embedding/text', response_model=list[float])
def get_text_embedding(text: str) -> list[float]:
    return e5_local.encode(text).tolist()


@server.post('/embedding/text-list', response_model=list[list[float]])
def get_text_embedding_list(text_ls: TextList) -> list[list[float]]:
    return [
        e5_local.encode(text).tolist()
        for text in text_ls.ls
    ]


@server.post('/embedding/words/new', response_model=list[list[float]])
def get_words_embedding_new(text_ls: TextList) -> list[float]:
    return [
        embedding_2023.get_sentence_vector(text).tolist()
        for text in text_ls.ls
    ]


@server.post('/embedding/words/old', response_model=list[list[float]])
def get_words_embedding_old(text_ls: TextList) -> list[float]:
    return [
        embedding_2022.get_sentence_vector(text).tolist()
        for text in text_ls.ls
    ]


@server.get('/eval/scores', response_model=EvalScores)
def get_eval_scores(text: str) -> EvalScores:
    return EvalScores(
        novelty_score=get_text_novelty(text),
        academic_score=get_text_academic(text),
        application_score=get_text_application(text),
        match_score=get_text_match(text),
        trend_score=get_text_trend(text),
    )


class WordXY(BaseModel):
    word: str
    x: float
    y: float
    sim: float


def words_embedding_to_xy(words: list[str], sims: list[float] | None = None):
    if sims is None:
        sims = [0. for _ in words]
    assert len(words) == len(sims)
    words_embedded = np.array([
        embedding_2023.get_word_vector(word)
        for word in words
    ])
    # 100 dims to 2 dims with TSNE
    tsne = TSNE(n_components=2, random_state=0, perplexity=5)
    words_embedded_2d = tsne.fit_transform(words_embedded)
    # convert to WordXY
    return [
        WordXY(x=x, y=y, word=words[i], sim=sims[i])
        for i, (x, y) in enumerate(words_embedded_2d)
    ]


@server.get('/charts/words-xy', response_model=list[WordXY])
def get_neighbors_words_xy(word: str) -> list[WordXY]:
    # word_embedding = embedding_2023.get_word_vector(word)
    neighbors = embedding_2023.get_nearest_neighbors(word, 15)
    sims, words = zip(*neighbors)
    return words_embedding_to_xy(words, sims)
