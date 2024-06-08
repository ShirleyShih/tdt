# uvicorn app:app --reload
from fastapi import *
from fastapi.responses import FileResponse
# from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
import mysql.connector
from mysql.connector import Error
from pydantic import BaseModel
from collections import Counter
from typing import Optional
import math

app=FastAPI()

app.mount("/static", StaticFiles(directory="static"))

# templates = Jinja2Templates(directory="templates")

# Add SessionMiddleware to the ASGI application
app.add_middleware(SessionMiddleware, secret_key="some-random-string")

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

# Database connection configuration
db_config = {
    'user': 'root',
    'password': '',
    'host': 'localhost',
    'database': 'tdt'
}

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

# con = mysql.connector.connect(**db_config)
# cursor = con.cursor(dictionary=True)
# test = cursor.fetchall()
# cursor.close()
# con.close()

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