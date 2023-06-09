const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const router = require("express").Router();
const { Client } = require("pg");

const port = process.env.PORT || 8080;
const client = new Client({
  host: "localhost",
  user: "imolinav",
  password: "imolinav",
  database: "postgres",
  port: 5432
});
client.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/api/home-recommendations", async (req, res) => {
  console.log("retrieving home recommendations");
  const q = 'select c.id, c.name, AVG(replace(e.score, \',\', \'.\')::real) from cities c, entities e where e.city_id = c.id group by c.id, c.name order by avg desc limit 5';
  const response = await client.query(q);
  res.set('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.json({ recommendations: response.rows });
});

app.get("/api/recommendations", async (req, res) => {
  console.log("retrieving recommendations");
  const q = 'select c.id, c.name, AVG(replace(e.score, \',\', \'.\')::real) from cities c, entities e where e.city_id = c.id group by c.id, c.name order by avg desc limit 5';
  let data = await client.query(q);
  let response = [];
  for (let i = 0; i < data.rows.length; i++) {
    const attractionsQuery = 'select e.id, e.name, e.score from entities e, cities c, entity_types et  where e.city_id = $1 and et.entity_id = e.id and et.entity_id  not in (select entity_id from entity_types where type = \'Restaurant\') group by e.id order by score desc limit 10';
    const values = [data.rows[i].id];
    const attractions = await client.query(attractionsQuery, values);
    const restaurantsQuery = 'select e.id, e.name, e.score from entities e, cities c, entity_types et  where e.city_id = $1 and et.entity_id = e.id and et.entity_id  not in (select entity_id from entity_types where type != \'Restaurant\') group by e.id order by score desc limit 10';
    const restaurants = await client.query(restaurantsQuery, values);
    response.push({
      ...data.rows[i],
      attractions: attractions.rows,
      restaurants: restaurants.rows
    })
  }
  res.set('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.json({ recommendations: response });
});

app.get("/api/recommendations/:user", (req, res) => {});

app.get("/api/planner", async (req, res) => {
  console.log("retrieving cities");
  const q = 'select id, name, latitude, longitude, population, altitude, govern_party from cities';
  const response = await client.query(q);
  res.set('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.json({ cities: response.rows });
});

app.get("/api/planner/:cityId", async (req, res) => {
  console.log("retrieving city entities");
  const q = 'select id, name, score, address from entities where city_id = $1';
  const values = [req.params.cityId];
  const response = await client.query(q, values);
  res.set('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.json({ city: response.rows });
});

app.listen(port, () => console.log(`API listening in port ${port}`));
