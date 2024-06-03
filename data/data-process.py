import json
import mysql.connector

with open("C:/Users/phoen/OneDrive/Work/wehelp/tdt/data/taipei-attractions.json", "r", encoding="utf-8") as response:
    data=json.load(response)
clist=data["result"]["results"]
# print(clist)

con = mysql.connector.connect(
    user="root",
    password="",
    host="localhost",
    database="tdt"
)

cursor = con.cursor()

# Create table if it doesn't exist
cursor.execute("""
    CREATE TABLE IF NOT EXISTS attractions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        description VARCHAR(2000) NOT NULL,
        address VARCHAR(255) NOT NULL,
        transport VARCHAR(2000) NOT NULL,
        mrt VARCHAR(255),
        lat FLOAT,
        lng FLOAT,
        images VARCHAR(5000)
    )
""")

for spot in clist:
    name=spot["name"]
    category=spot["CAT"]
    description=spot["description"]
    address=spot["address"]
    transport=spot["direction"]
    mrt=spot["MRT"]
    lat=float(spot["latitude"])
    lng=float(spot["longitude"])
    
    extensions = [".jpg", ".JPG", ".png", ".PNG"]
    images=[]
    for url in spot["file"].split("https:"):
        if any(ext in url for ext in extensions):
            images.append("https:" + url)
    # print(images)
    # convert the images list to a comma-separated string
    images_str = ",".join(images)
    
    cursor.execute("""
                   insert into attractions(name,category,description,address,transport,mrt,lat,lng,images)
                   values (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                   """,(name,category,description,address,transport,mrt,lat,lng,images_str))

# cursor.execute("delete from attractions")
con.commit()
cursor.close()