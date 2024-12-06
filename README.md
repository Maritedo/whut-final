
# ecnu ai apply

```shell

# start databases' services
db.bat

# start model server
cd backend
python -m uvicorn model_server:server --port 8002

# start main server
cd backend
python -m uvicorn server.main:app

# start front-end demo
cd frontend
npm start

```
