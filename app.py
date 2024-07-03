# uvicorn app:app --reload
from fastapi import *
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.responses import FileResponse
# from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
# from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
import mysql.connector
from mysql.connector import Error
from data.dbconfig import db_config # connect to dbconfig.py
from pydantic import BaseModel
from collections import Counter
from typing import Optional
import math
import jwt
from fastapi.security import OAuth2PasswordBearer
import datetime

app=FastAPI()

app.mount("/static", StaticFiles(directory="static"))

# templates = Jinja2Templates(directory="templates")

# Add SessionMiddleware to the ASGI application
app.add_middleware(SessionMiddleware, secret_key="some-random-string")

SECRET_KEY="abc"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Token expiration time

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")
@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")
@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")

class Attraction(BaseModel):
     id: str
     name: str
     category: str
     description: str
     address: str
     transport: str
     mrt: str
     lat: float
     lng: float
     images: list[str]

@app.get("/api/attractions")
async def apiattractions(page: Optional[int] = 0, keyword: Optional[str] = None):
    items_per_page = 12
    offset = page * items_per_page

    try:
        con = mysql.connector.connect(**db_config)
        cursor = con.cursor(dictionary=True)

        if keyword:
            query = (
                "SELECT * FROM attractions "
                "WHERE name LIKE %s OR (mrt IS NOT NULL AND mrt LIKE %s) "
                "LIMIT %s OFFSET %s"
            )
            cursor.execute(query, (f"%{keyword}%", f"%{keyword}%", items_per_page, offset))
        else:
            query = "SELECT * FROM attractions LIMIT %s OFFSET %s"
            cursor.execute(query, (items_per_page, offset))
        
        result = cursor.fetchall()
        # Split the images string into a list of URLs
        for item in result:
            item["images"] = item["images"].split(',')

        # Get the total count of filtered records for pagination
        if keyword:
            count_query = (
                "SELECT COUNT(*) FROM attractions "
                "WHERE name LIKE %s OR (mrt IS NOT NULL AND mrt LIKE %s)"
            )
            cursor.execute(count_query, (f"%{keyword}%", f"%{keyword}%",))
        else:
            count_query = "SELECT COUNT(*) FROM attractions"
            cursor.execute(count_query)
        
        total_items = cursor.fetchone()["COUNT(*)"]
        total_pages = math.ceil(total_items / items_per_page)

        cursor.close()
        con.close()

        next_page = page + 1 if (page + 1) < total_pages else None

        if page>=total_pages or page<0:
             return {"error": True, "message": "請按照情境提供對應的錯誤訊息"}
        return {"nextPage": next_page, "data": result}
		
    except Error as e:
        return {"error": True, "message": str(e)}

@app.get("/api/attractions/{attractionID}")
async def get_attraction(attractionID: int):
    try:
        con = mysql.connector.connect(**db_config)
        cursor = con.cursor(dictionary=True)

        query = "SELECT * FROM attractions WHERE id = %s"
        cursor.execute(query, (attractionID,))
        result = cursor.fetchone()
        # Split the images string into a list of URLs
        result["images"] = result["images"].split(',')

        cursor.close()
        con.close()

        if result:
            return {"data": result}
        else:
            return {"error": True, "message": "Attraction not found"}

    except Error as e:
        return {"error": True, "message": str(e)}

@app.get("/api/mrts")
async def apimarts():
    try:
        con = mysql.connector.connect(**db_config)
        cursor = con.cursor()

        cursor.execute("SELECT mrt FROM attractions WHERE mrt IS NOT NULL")
        result = cursor.fetchall()

        mrt_counts = Counter(item[0] for item in result)
        
        # Sort MRT stations by frequency in descending order
        sorted_mrts = sorted(mrt_counts.items(), key=lambda x: x[1], reverse=True)
        
        cursor.close()
        con.close()

        if mrt_counts:
            return {"data": [item[0] for item in sorted_mrts]}
        else:
            return {"error": True, "message": "No MRT stations found"}

    except Error as e:
        return {"error": True, "message": str(e)}


class User(BaseModel):
    name: str
    email: str
    password: str

@app.post("/api/user")
async def signup(response: Response, user: User):
    try:
        con = mysql.connector.connect(**db_config)
        cursor=con.cursor()
        cursor.execute("select * from member where email=%s",(user.email,))
        result=cursor.fetchone()

        if result:
            response.status_code=400
            return {"error": True, "message": "Email已經註冊帳戶"}
        
        cursor.execute("insert into member(name,email,password) values(%s,%s,%s)",(user.name,user.email,user.password))
        con.commit()

        response.status_code=200
        return {"ok": True, "message": "註冊成功，請登入系統"}
    
    except Error as e:
        response.status_code=500
        return {"error": True, "message": "內部伺服器錯誤"}

    finally:
        cursor.close()
        con.close()

class User_signin(BaseModel):
    email: str
    password: str

def create_access_token(data: dict, expires_delta: datetime.timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
    
@app.put("/api/user/auth")
async def login(response: Response, user: User_signin):
    con = None
    cursor = None
    try:
        con = mysql.connector.connect(**db_config)
        cursor = con.cursor()
        cursor.execute("SELECT id, name FROM member WHERE email=%s AND password=%s", (user.email, user.password))
        result = cursor.fetchone()

        if not result:
            response.status_code = 400
            return {"error": True, "message": "Email或密碼錯誤"}
        
        user_id, name = result
        token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(data={"id": user_id, "name": name, "email": user.email}, expires_delta=token_expires)
        # print(token)
        return {"token": token}
    
    except Error as e:
        response.status_code = 500
        return {"error": True, "message": "內部伺服器錯誤"}
    
    finally:
        if cursor:
            cursor.close()
        if con:
            con.close()

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    return payload

@app.get("/api/user/auth")
async def get_user(current_user: dict = Depends(get_current_user)):
    return {"data": current_user}