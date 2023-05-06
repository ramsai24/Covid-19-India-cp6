const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1

const convertSnakeToCamel = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  let sqlQuery = `
    SELECT * 
    FROM state;`;

  let stateList = await db.all(sqlQuery);
  response.send(stateList.map((eachObject) => convertSnakeToCamel(eachObject)));
});

//API 2

app.get("/states/:stateId", async (request, response) => {
  let { stateId } = request.params;

  const sqlQuery = `
    SELECT * 
    FROM state 
    WHERE 
        state_id = ${stateId};`;

  const stateDetails = await db.get(sqlQuery);
  response.send(convertSnakeToCamel(stateDetails));
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const sqlQuery = `
    INSERT INTO 
        district ( 
            district_name,
            state_id,
            cases,
            cured,
            active,
            deaths)
    VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}); `;

  const updatedList = await db.run(sqlQuery);
  response.send("District Successfully Added");
  //response.send([{ id: updatedList.lastID }, "District Successfully Added"]);
});

//API 4

const convertSnakeToCamel1 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    death: dbObject.death,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;

  const sqlQuery = `
    SELECT * 
    FROM district 
    WHERE 
        district_id = ${districtId};`;

  const districtDetails = await db.get(sqlQuery);
  response.send(convertSnakeToCamel1(districtDetails));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;

  const sqlQuery = `DELETE FROM district
    WHERE district_id = ${districtId};`;

  await db.run(sqlQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  console.log(districtId);
  const sqlQuery = ` 
  UPDATE district
  SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE 
        district_id = ${districtId};`;

  const updatedList = await db.run(sqlQuery);
  response.send("District Details Updated");
});

//API 7

const convertSnakeToCamel2 = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeath: dbObject.deaths,
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;

  const sqlQuery = `
    SELECT  cases, cured, active, deaths
    FROM district 
    WHERE 
        state_id = ${stateId};`;
  //SUM(cases), SUM(cured),SUM(active), SUM(deaths)
  const districtDetails = await db.get(sqlQuery);
  response.send(convertSnakeToCamel2(districtDetails));
});

//API 8

const convertSnakeToCamel3 = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;

  const sqlQuery = `
    SELECT  state_name
    FROM district INNER JOIN state ON  district.state_id = state.state_id
    WHERE 
        district_id = ${districtId};`;
  //SUM(cases), SUM(cured),SUM(active), SUM(deaths)
  const districtDetails = await db.get(sqlQuery);
  response.send(convertSnakeToCamel3(districtDetails));
});

module.exports = app;
