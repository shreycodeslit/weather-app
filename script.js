// Weather data comes from Open-Meteo (open-meteo.com): free, and no API key needed.
// City names for "My Weather" come from BigDataCloud's free reverse-geocoding endpoint.
const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");

const grantAccessContainer = document.querySelector(".grant-location-container");
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");
const errorContainer = document.querySelector(".error-container");
const errorText = document.querySelector("[data-errorText]");

let oldTab = userTab;
oldTab.classList.add("current-tab");
getfromSessionStorage();

function switchTab(newTab) {
    if (newTab == oldTab) return;
    oldTab.classList.remove("current-tab");
    oldTab = newTab;
    oldTab.classList.add("current-tab");
    errorContainer.classList.remove("active");
    userInfoContainer.classList.remove("active");

    if (!searchForm.classList.contains("active")) {
        grantAccessContainer.classList.remove("active");
        searchForm.classList.add("active");
    } else {
        searchForm.classList.remove("active");
        getfromSessionStorage();
    }
}

userTab.addEventListener("click", () => switchTab(userTab));
searchTab.addEventListener("click", () => switchTab(searchTab));

// Reuses the coordinates from earlier in this visit, if the visitor already shared them
function getfromSessionStorage() {
    let saved = null;
    try { saved = sessionStorage.getItem("user-coordinates"); } catch (e) {}
    if (!saved) {
        grantAccessContainer.classList.add("active");
    } else {
        fetchUserWeatherInfo(JSON.parse(saved));
    }
}

// Open-Meteo reports conditions as WMO weather codes; this turns them into words and an icon
const CONDITIONS = {
    0: ["clear sky", "01"], 1: ["mainly clear", "02"], 2: ["partly cloudy", "03"], 3: ["overcast", "04"],
    45: ["fog", "50"], 48: ["freezing fog", "50"],
    51: ["light drizzle", "09"], 53: ["drizzle", "09"], 55: ["heavy drizzle", "09"],
    56: ["freezing drizzle", "09"], 57: ["heavy freezing drizzle", "09"],
    61: ["light rain", "10"], 63: ["rain", "10"], 65: ["heavy rain", "10"],
    66: ["freezing rain", "13"], 67: ["heavy freezing rain", "13"],
    71: ["light snow", "13"], 73: ["snow", "13"], 75: ["heavy snow", "13"], 77: ["snow grains", "13"],
    80: ["light showers", "09"], 81: ["showers", "09"], 82: ["heavy showers", "09"],
    85: ["snow showers", "13"], 86: ["heavy snow showers", "13"],
    95: ["thunderstorm", "11"], 96: ["thunderstorm with hail", "11"], 99: ["thunderstorm with heavy hail", "11"],
};

async function getWeather(lat, lon) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: "temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,weather_code,is_day",
        wind_speed_unit: "ms",
        timezone: "auto",
    });
    const response = await fetch(url);
    if (!response.ok) throw new Error("weather");
    return (await response.json()).current;
}

async function placeName(lat, lon) {
    try {
        const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
        url.search = new URLSearchParams({ latitude: lat, longitude: lon, localityLanguage: "en" });
        const data = await (await fetch(url)).json();
        return { name: data.city || data.locality || data.principalSubdivision || "Your location", country: data.countryCode };
    } catch (e) {
        return { name: "Your location", country: "" };
    }
}

// Finds a city. "Paris, France" or "Hyderabad, IN" narrows it down to that country or state.
async function findCity(query) {
    const [name, ...rest] = query.split(",").map((s) => s.trim());
    const hint = rest.join(" ").toLowerCase();
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.search = new URLSearchParams({ name, count: 10, language: "en", format: "json" });
    const response = await fetch(url);
    if (!response.ok) throw new Error("search");
    const results = (await response.json()).results || [];
    if (!hint) return results[0];
    return results.find((r) => [r.country, r.country_code, r.admin1].some((v) => v && v.toLowerCase() === hint)) || results[0];
}

function show(container) {
    [grantAccessContainer, loadingScreen, userInfoContainer, errorContainer].forEach((c) => c.classList.remove("active"));
    if (container) container.classList.add("active");
}

function showError(message) {
    errorText.innerText = message;
    show(errorContainer);
}

async function fetchUserWeatherInfo({ lat, lon }) {
    show(loadingScreen);
    try {
        const [current, place] = await Promise.all([getWeather(lat, lon), placeName(lat, lon)]);
        renderWeatherInfo(place, current);
    } catch (error) {
        showError("Couldn't load the weather. Check your connection and try again.");
    }
}

function renderWeatherInfo(place, current) {
    const [description, icon] = CONDITIONS[current.weather_code] || ["unknown", "03"];
    document.querySelector("[data-cityName]").innerText = place.name;
    const flag = document.querySelector("[data-countryIcon]");
    flag.hidden = !place.country;
    if (place.country) flag.src = `https://flagcdn.com/144x108/${place.country.toLowerCase()}.png`;
    document.querySelector("[data-weatherDesc]").innerText = description;
    const weatherIcon = document.querySelector("[data-weatherIcon]");
    weatherIcon.src = `https://openweathermap.org/img/wn/${icon}${current.is_day ? "d" : "n"}@2x.png`;
    weatherIcon.alt = description;
    document.querySelector("[data-temp]").innerText = `${current.temperature_2m.toFixed(1)} °C`;
    document.querySelector("[data-windspeed]").innerText = `${current.wind_speed_10m.toFixed(1)} M/S`;
    document.querySelector("[data-humidity]").innerText = `${current.relative_humidity_2m}%`;
    document.querySelector("[data-cloudiness]").innerText = `${current.cloud_cover}%`;
    show(userInfoContainer);
}

function getLocation() {
    if (!navigator.geolocation) {
        showError("Your browser can't share its location. Use Search City instead.");
        return;
    }
    navigator.geolocation.getCurrentPosition(showPosition, () => {
        showError("Location access was blocked. Allow it in your browser, or use Search City.");
    });
}

function showPosition(position) {
    const userCoordinates = { lat: position.coords.latitude, lon: position.coords.longitude };
    try { sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates)); } catch (e) {}
    fetchUserWeatherInfo(userCoordinates);
}

document.querySelector("[data-grantAccess]").addEventListener("click", getLocation);

const searchInput = document.querySelector("[data-searchInput]");
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const city = searchInput.value.trim();
    if (city) fetchSearchWeatherInfo(city);
});

async function fetchSearchWeatherInfo(city) {
    show(loadingScreen);
    try {
        const found = await findCity(city);
        if (!found) {
            showError(`Couldn't find "${city}". Check the spelling, or add the country: Paris, France.`);
            return;
        }
        const current = await getWeather(found.latitude, found.longitude);
        renderWeatherInfo({ name: found.name, country: found.country_code }, current);
    } catch (error) {
        showError("Couldn't load the weather. Check your connection and try again.");
    }
}
