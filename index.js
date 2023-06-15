const express = require("express");
const app = express();
const cors = require('cors');
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
app.use(cors({ origin: 'http://localhost:4200' }));

app.get("/api/login", async (req, res) => {
  console.log("logging in");
  const q = 'select id, name, last_names as lastName, email, gender from users where email = $1 and password = $2';
  const values = [req.query.email, req.query.password];
  const response = await client.query(q, values);
  if (response.rows.length === 0) {
    res.json({ user: null });
  } else {
    res.json({ user: response.rows[0] });
  }
})

app.get("/api/home-recommendations", async (req, res) => {
  console.log("retrieving home recommendations");
  const q = 'select c.id, c.name, AVG(replace(e.score, \',\', \'.\')::real) from cities c, entities e where e.city_id = c.id group by c.id, c.name order by avg desc limit 5';
  const response = await client.query(q);
  res.json({ recommendations: response.rows });
});

app.get("/api/recommendations", async (req, res) => {
  console.log("retrieving recommendations");
  const q = 'select c.id, c.name, AVG(replace(e.score, \',\', \'.\')::real) from cities c, entities e where e.city_id = c.id group by c.id, c.name order by avg desc limit 5';
  let data = await client.query(q);
  let response = [];
  for (let i = 0; i < data.rows.length; i++) {
    const attractionsQuery = 'select e.id, e.name, replace(e.score, \',\', \'.\')::real as score from entities e, cities c, entity_types et  where e.city_id = $1 and et.entity_id = e.id and et.entity_id  not in (select entity_id from entity_types where type = \'Restaurant\') group by e.id order by score desc limit 10';
    const values = [data.rows[i].id];
    const attractions = await client.query(attractionsQuery, values);
    const restaurantsQuery = 'select e.id, e.name, replace(e.score, \',\', \'.\')::real as score from entities e, cities c, entity_types et  where e.city_id = $1 and et.entity_id = e.id and et.entity_id  not in (select entity_id from entity_types where type != \'Restaurant\') group by e.id order by score desc limit 10';
    const restaurants = await client.query(restaurantsQuery, values);
    response.push({
      ...data.rows[i],
      attractions: attractions.rows,
      restaurants: restaurants.rows
    })
  }
  res.json({ recommendations: response });
});

app.get("/api/recommendations/:user", async (req, res) => {
  console.log("retrieving recommendations");
  
  res.json({ recommendations: 'WIP' });
});

app.get("/api/planner", async (req, res) => {
  console.log("retrieving cities");
  const q = 'select c.id, c.name, AVG(replace(e.score, \',\', \'.\')::real), c.latitude, c.longitude, c.population, c.altitude, c.govern_party from cities c, entities e where e.city_id = c.id group by c.id, c.name order by avg desc';
  const response = await client.query(q);
  res.json({ cities: response.rows });
});

app.get("/api/planner/:cityId", async (req, res) => {
  const q = 'select c.id, c.name, AVG(replace(e.score, \',\', \'.\')::real), c.latitude, c.longitude, c.population, c.altitude, c.govern_party from cities c, entities e where e.city_id = c.id and c.id = $1 group by c.id';
  const values = [req.params.cityId];
  let data = await client.query(q, values);
  let response = [];
  for (let i = 0; i < data.rows.length; i++) {
    const attractionsQuery = 'select e.id, e.name, replace(e.score, \',\', \'.\')::real as score from entities e, cities c, entity_types et  where e.city_id = $1 and et.entity_id = e.id and et.entity_id  not in (select entity_id from entity_types where type = \'Restaurant\') group by e.id order by score desc';
    const values = [req.params.cityId];
    const attractions = await client.query(attractionsQuery, values);
    const restaurantsQuery = 'select e.id, e.name, replace(e.score, \',\', \'.\')::real as score from entities e, cities c, entity_types et  where e.city_id = $1 and et.entity_id = e.id and et.entity_id  not in (select entity_id from entity_types where type != \'Restaurant\') group by e.id order by score desc';
    const restaurants = await client.query(restaurantsQuery, values);
    response.push({
      ...data.rows[i],
      attractions: attractions.rows,
      restaurants: restaurants.rows
    })
  }
  res.json({ city: response[0] });
});

app.post("/api/score/:attractionId", async (req, res) => {
  const preq = 'select * from user_has_seen_entity where user_id = $1 and entity_id = $2';
  const prevalues = [req.body.userId, req.params.attractionId];
  const exists = await client.query(preq, prevalues);
  let q = '';
  if (exists) {
    q = 'update user_has_seen_entity set score = $3 where user_id = $1 and entity_id = $2';
  } else {
    q = 'insert into user_has_seen_entity values ($1, $2, $3)';
  }
  const values = [req.body.userId, req.params.attractionId, req.body.score];
  const response = await client.query(q, values);
  res.json({ data: response[0] });
});

app.listen(port, () => console.log(`API listening in port ${port}`));
