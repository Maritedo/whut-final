
# How to install fasttext in Windows 11 or Windows 10 without any error
# https://www.youtube.com/watch?v=wklHA9Y6SZA
# https://github.com/mdrehan4all/fasttext_wheels_for_windows

import fasttext

new_text_path = r"C:\Users\realj\Desktop\Projects\AFAS4PI\assets\data\corpus\corpus-new.text"

new_model = fasttext.train_unsupervised(
    new_text_path,
    epoch=3,
    thread=14,
    minn=2, 
    maxn=20,
)

old_text_path = r"C:\Users\realj\Desktop\Projects\AFAS4PI\assets\data\corpus\corpus-old.text"

old_model = fasttext.train_unsupervised(
    old_text_path,
    epoch=3,
    thread=14,
    minn=2, 
    maxn=20,
)

new_model.save_model(r"C:\Users\realj\Desktop\Projects\whut-final\backend\var\fasttext-models\2023-model.bin")
old_model.save_model(r"C:\Users\realj\Desktop\Projects\whut-final\backend\var\fasttext-models\2022-model.bin")
