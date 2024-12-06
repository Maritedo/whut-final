
import argparse

from selenium.webdriver import Chrome

from ..crawler import item_list, item_detail
from ..crawler.logger import get_default_logger
from ..crawler.config import ItemDetailCrawlerConfig, load_state, ItemListCrawlerConfig
from ..database import ItemListMongo, ItemDetailMongo

parser = argparse.ArgumentParser()
parser.add_argument('--mode', type=str, choices=[
    "item-list",
    "item-detail",
])
parser.add_argument('--config', type=str, default="./config.json")

args = parser.parse_args()
logger = get_default_logger(args.mode)


def run_with_retry(conf, fn, *args, **kwargs):
    for _ in range(conf.retry + 1):
        try:
            fn(*args, **kwargs)
            break
        except Exception as e:
            logger.warning(f"Retry {_+1} for {repr(e)}")
            if _ == conf.retry:
                raise e

def open_or_default_config(conf_path, cls):
    try:
        open(conf_path).close()
        conf = load_state(conf_path, cls)
    except FileNotFoundError:
        logger.warning(f"config '{conf_path}' not found.")
        conf = cls({})
    return conf


if args.mode == "item-list":
    client = Chrome(item_list.get_chrome_options())
    db = ItemListMongo("final")
    conf = open_or_default_config(args.config, ItemListCrawlerConfig)

    run_with_retry(conf, item_list.crawl, client, db, logger, conf)

elif args.mode == "item-detail":
    list_db = ItemListMongo("final")
    detail_db = ItemDetailMongo("final")
    conf = open_or_default_config(args.config, ItemDetailCrawlerConfig)

    run_with_retry(conf, item_detail.crawl, logger, conf, list_db, detail_db)
