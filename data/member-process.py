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

cursor.execute("""
    CREATE TABLE IF NOT EXISTS booking (
        id bigint primary key auto_increment,
        memberid bigint not null,
        attractionid bigint not null,
        date varchar(255) not null,
        time varchar(255) not null,
        price bigint not null
    )
""")

# cursor.execute("delete from attractions")
con.commit()
cursor.close()