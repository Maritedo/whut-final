
import json


class _BaseConfig:
    def __init__(self, conf_dict: dict) -> None:
        self.retry = conf_dict.get("retry", 30)

    def save_state(self, path: str) -> None:
        with open(path, 'w') as f:
            json.dump(self.__dict__, f)

def load_state(path: str, cls):
    with open(path, 'r') as f:
        conf_dict = json.load(f)
    return cls(conf_dict)


class ItemListCrawlerConfig(_BaseConfig):
    def __init__(self, conf_dict: dict) -> None:
        self.start = conf_dict.get('start', 2017)
        self.end = conf_dict.get('end', 2023)
        self.current = conf_dict.get('current', self.start)
        self.sleep_time = conf_dict.get('sleep_time', 0.1)
        self.page = conf_dict.get('page', 1)
        super().__init__(conf_dict)

    def __repr__(self) -> str:
        return f'ItemListConfig(start={self.start}, end={self.end}, current={self.current}, sleep_time={self.sleep_time}, page={self.page})'

class ItemDetailCrawlerConfig(_BaseConfig):
    def __init__(self, conf_dict: dict) -> None:
        self.sleep_time = conf_dict.get('sleep_time', 0.1)
        self.incremental = conf_dict.get('incremental', True)
        self.cache_size = conf_dict.get('cache_size', 256)
        super().__init__(conf_dict)

    def __repr__(self) -> str:
        return f'ItemDetailConfig(sleep_time={self.sleep_time})'