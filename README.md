# What is the Weather

Check temperature, humidity, wind speed and cloud cover for your current location or any city.

Plain HTML, CSS and JavaScript on the OpenWeather API. Requests go through a small Vercel Edge Function (`api/weather.js`), so the API key stays on the server.

## Running it

Set `OPENWEATHER_API_KEY` (free key from openweathermap.org) in Vercel → Settings → Environment Variables, or run `npx vercel dev` locally with it in `.env`.
