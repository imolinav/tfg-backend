import sys
import json
import psycopg2
from psycopg2.extras import RealDictCursor

db_parameters = {
    "host": "localhost",
    "user": "imolinav",
    "password": "imolinav",
    "dbname": "postgres",
}
connection = psycopg2.connect(**db_parameters)
cur = connection.cursor(cursor_factory=RealDictCursor)
cur.execute("select e.id, e.name, replace(e.score, ',', '.')::real as score, e.city_id from entities e")
entitiesData = cur.fetchall()

print(entitiesData[0])

# userData = json.loads(sys.argv[1])

# print(userData[0]["id"])