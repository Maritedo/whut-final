
from typing import Optional

from pydantic import BaseModel
from pymongo import MongoClient


class User(BaseModel):

    id: str
    password_hash: str

    name: str
    privilege: int
    org_name: Optional[str] = None


class UserLoginInput(BaseModel):

    id: str
    password_hash: str


class UserData:

    def __init__(self, client: MongoClient, db_name: str):
        self.client = client
        self.db = self.client[db_name]
        self.collection = "serverUser"

    def create_user(self, inputs: User):
        self.db[self.collection].insert_one(inputs.model_dump())

    def is_password_ok(self, inputs: UserLoginInput):
        user = self.db[self.collection].find_one({"id": inputs.id})
        if user is None:
            return False
        return user["password_hash"] == inputs.password_hash
    
    def get_user_info(self, user_id: str) -> User:
        user = self.db[self.collection].find_one({"id": user_id})
        if user is None:
            return None
        return User(**user)
    
    # def update_user(self, inputs: User):
    #     self.db[self.collection].update_one(
    #         {"id": inputs.id}, {"$set": inputs.model_dump()})

    # def delete_user(self, inputs: User):
    #     self.db[self.collection].delete_one({"id": inputs.id})


