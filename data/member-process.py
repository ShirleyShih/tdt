import mysql.connector
from dbconfig import db_config # connect to dbconfig.py

con = mysql.connector.connect(**db_config)
cursor = con.cursor()

# Create table if it doesn't exist
cursor.execute("""
    CREATE TABLE IF NOT EXISTS member (
        id bigint primary key auto_increment,
        name varchar(255) not null,
        email varchar(255) not null,
        password varchar(255) not null
    )
""")

# cursor.execute("delete from attractions")
con.commit()
cursor.close()