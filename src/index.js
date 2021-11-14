const express = require("express");
const app = express();
const axios = require("axios");
const responseTime = require("response-time");
const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient();

const GET_REDIS = promisify(client.get).bind(client);
const SET_REDIS = promisify(client.set).bind(client);

app.use(responseTime());

app.get("/api/characters", async (req, res) => {
	try {
		// Get response of redis
		const reply = await GET_REDIS("characters");
		if (reply) return res.json(JSON.parse(reply));

		// Get response of api
		let response = await axios.get("https://rickandmortyapi.com/api/character");
		response = response.data;
		res.json(response);

		// Set response in redis
		await SET_REDIS("characters", JSON.stringify(response));
	} catch (e) {
		console.log(e);
	}
});

app.get("/api/character/:id", async (req, res) => {
	try {
		const id = req.params.id;
		// Get response of redis
		const reply = await GET_REDIS(`character${id}`);
		if (reply) return res.json(JSON.parse(reply));

		// Get response of api
		let response = await axios.get(
			`https://rickandmortyapi.com/api/character/${id}`
		);
		response = response.data;
		res.json(response);

		// Set response in redis
		await SET_REDIS(`character${id}`, JSON.stringify(response));
	} catch (e) {
		return res.status(e.response.status).json({ message: e.message });
	}
});

app.listen(4000, () => console.log("Server started on port 4000"));
