
import os
import sys


PATH = ""

def get_file_names(path_str: str):
    file_names: list[str] = os.listdir(path_str)
    file_names = [name for name in file_names if name.endswith(".csv")]
    return file_names

def unicode_to_gbk(path: str, file_name: str):
    src = open(path + file_name, "r", encoding="utf-8", errors='ignore')
    tgt = open(path + "gbk-" + file_name, "w", encoding="gbk", errors='ignore')
    tgt.write(src.read())
    src.close()
    tgt.close()


if __name__ == "__main__":
    PATH = sys.argv[1]
    file_names = get_file_names(PATH)
    for file_name in file_names:
        unicode_to_gbk(PATH, file_name)
    print("done")

