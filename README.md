# What's the Weather

Check the temperature, humidity, wind speed and cloud cover for your current location or any city in the world.

Plain HTML, CSS and JavaScript. Weather comes from [Open-Meteo](https://open-meteo.com/), which is free and needs no API key, so the whole app is a static site with nothing to configure.

- **My Weather** asks for your location, then names your city using BigDataCloud's free reverse-geocoding.
- **Search City** finds any city through Open-Meteo's geocoding. Add a country or state to narrow it down: `Paris, France` or `Hyderabad, IN`.
- Clear messages when a city isn't found, location access is blocked, or the connection drops.

## Running it

Open `index.html` in a browser, or deploy the folder to any static host (it's on Vercel with default settings).

The first version used the OpenWeather API with the key written into the page. It moved to Open-Meteo so no key is needed or exposed.
