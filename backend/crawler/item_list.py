
from time import sleep, localtime
import logging

from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4.element import Tag
from bs4 import BeautifulSoup

from ..database import ItemListMongo
from ..crawler.config import ItemListCrawlerConfig


target = "http://gjcxcy.bjtu.edu.cn/NewLXItemListForStudent.aspx?year={}"


def get_chrome_options():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('window-size=1400,900')
    return options


def crawl(
    client: Chrome,
    mongo: ItemListMongo,
    logger: logging.Logger,
    config: ItemListCrawlerConfig,
):
    try:
        start = config.current if config.start != config.current else config.start
        for year in range(start, config.end+1):
            page_source = enter_first_page(client, config, target.format(year))
            page_soup = BeautifulSoup(page_source, 'lxml')
            total_page = find_total_page(page_soup)
            logger.info(f"Total page of {year}: {total_page}")
            start_page = config.page if year == start else 1
            for page in range(start_page, total_page+1):
                page_source = enter_page(client, config, page)
                page_soup = BeautifulSoup(page_source, 'lxml')
                item_list = parse_data(page_soup)
                logger.info(
                    f"Page {page} of {year}: length of item list = {len(item_list)}"
                )
                store_data(mongo, item_list)
    except Exception as e:
        logger.error(e)
        now = localtime()
        state = config.__dict__
        state["current"] = year
        state["page"] = page
        ItemListCrawlerConfig(state).save_state(
            f'crawler-item-list-{now.tm_mon}{now.tm_mday}-{now.tm_hour}{now.tm_min}.json'
        )
        raise e


def wait(client: Chrome, conf: ItemListCrawlerConfig):
    wait = WebDriverWait(client, 10)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "script")))
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "a")))
    sleep(conf.sleep_time)


def enter_first_page(client: Chrome, conf: ItemListCrawlerConfig, url: str):

    client.get(url)

    wait(client, conf)
    return client.page_source


def find_total_page(soup: BeautifulSoup) -> int:
    return int(soup.select(".pager-info--number-")[-1].text)


def enter_page(client: Chrome, conf: ItemListCrawlerConfig, page: int):

    client.execute_script(
        f"__doPostBack('ctl00$ContentMain$AspNetPager1','{page}');"
    )
    wait(client, conf)
    return client.page_source


def parse_data(soup: BeautifulSoup) -> list[dict]:
    trs = soup.select('tr:not(thead tr)')

    def tr_to_dict(tr: Tag):
        tds = tr.find_all('td')
        return {
            "number": tr['id'].split('_')[-1],
            "code": tds[1].get_text(strip=True),
            "title": tds[2].get_text(strip=True),
            "members": tr.find_all('td')[3].get_text(strip=True).split('、'),
            "level": tr.find_all('td')[4].get_text(strip=True),
            "teachers": tr.find_all('td')[5].get_text(strip=True).split('、'),
            "school": tr.find_all('td')[6].get_text(strip=True),
        }

    return [tr_to_dict(tr) for tr in trs]


def store_data(mongo: ItemListMongo, data: list[dict]):
    mongo.insert_many_items(data)
