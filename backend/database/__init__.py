
from pymongo import MongoClient

CLIENT = MongoClient(
    host="localhost",
    port=27017,
)

ACADEMY_STOP_WORDS: list[str]
with open("./database/ac_stop_words.dict", "r", encoding="utf-8") as f:
    ACADEMY_STOP_WORDS = f.read().split("\n")

class ItemListMongo:

    def __init__(self, db: str) -> None:
        self.db = db
        self.collection = CLIENT[self.db]["itemList"]

    def insert_many_items(self, items: list[dict]) -> None:
        self.collection.insert_many(items)


class ItemDetailMongo:

    def __init__(self, db: str) -> None:
        self.db = db
        self.collection = CLIENT[self.db]["itemDetail"]

    def insert_one_item(self, item: dict) -> None:
        self.collection.insert_one(item)

    def insert_many_items(self, items: list[dict], *args, **kwargs) -> None:
        self.collection.insert_many(items, *args, **kwargs)

    def is_number_exist(self, number: str) -> bool:
        return self.collection.find_one({'number': number}) is not None
