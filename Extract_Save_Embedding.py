from deepface import DeepFace
import json
import os
import pandas as pd
data_embedding_class= []
parent_dir = r'D:\DeepFace\StudentsFacial\21DTHX'
directories = os.listdir(parent_dir)


for item in directories:
    mssv, name = item.split('+')
    item_path = os.path.join(parent_dir, item)
    file_images = os.listdir(item_path)
    for file_image in file_images:
        image_path = os.path.join(item_path, file_image)
        embedding_objs = DeepFace.represent(img_path=str(image_path), model_name='ArcFace', detector_backend='opencv')
        new_embedding = embedding_objs[0]['embedding']
        data = {
            "mssv": mssv,
            "name": name,
            "embedding": new_embedding,

        }
        data_embedding_class.append(data)

with open(r"./database/21DTHX.json", "w") as f:
    json.dump(data_embedding_class, f, indent=4)