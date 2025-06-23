// 天气API管理类
class WeatherAPI {
    constructor() {
        // 使用WeatherAPI.com - 无需电话验证，免费100万次/月
        // 🔑 请将下面的 'YOUR_API_KEY_HERE' 替换为您的实际API密钥
        // 📝 注册地址: https://www.weatherapi.com/
        this.apiKey = '74c4522dda244d96aee90759252306'; // ✅ API密钥已配置
        this.baseUrl = 'https://api.weatherapi.com/v1';
        this.alertsUrl = 'https://api.weatherapi.com/v1';
        this.isOnline = false;
        this.checkAPIStatus();
    }

    // 检查API状态
    async checkAPIStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/current.json?key=${this.apiKey}&q=New York&aqi=no`);
            this.isOnline = response.ok;
            this.updateStatusIndicator();
            return this.isOnline;
        } catch (error) {
            console.error('API状态检查失败:', error);
            this.isOnline = false;
            this.updateStatusIndicator();
            return false;
        }
    }

    // 更新状态指示器
    updateStatusIndicator() {
        const statusElement = document.getElementById('api-status');
        if (statusElement) {
            if (this.isOnline) {
                statusElement.className = 'status-indicator online';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> API Online';
            } else {
                statusElement.className = 'status-indicator offline';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> API Offline';
            }
        }
    }

    // 检查API密钥是否有效
    isValidApiKey() {
        return this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE';
    }

    // 根据城市名获取当前天气
    async getCurrentWeatherByCity(cityName) {
        if (!this.isValidApiKey()) {
            throw new Error('请先设置有效的API密钥');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/current.json?key=${this.apiKey}&q=${cityName},US&aqi=yes`
            );
            
            if (!response.ok) {
                throw new Error(`城市"${cityName}"未找到`);
            }
            
            const data = await response.json();
            return this.formatCurrentWeatherDataWeatherAPI(data);
        } catch (error) {
            console.error('获取城市天气失败:', error);
            throw error;
        }
    }

    // 根据坐标获取当前天气
    async getCurrentWeatherByCoords(lat, lon) {
        if (!this.isValidApiKey()) {
            throw new Error('请先设置有效的API密钥');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/current.json?key=${this.apiKey}&q=${lat},${lon}&aqi=yes`
            );
            
            if (!response.ok) {
                throw new Error('无法获取当前位置的天气信息');
            }
            
            const data = await response.json();
            return this.formatCurrentWeatherDataWeatherAPI(data);
        } catch (error) {
            console.error('获取坐标天气失败:', error);
            throw error;
        }
    }

    // 获取5天天气预报
    async getForecast(lat, lon) {
        if (!this.isValidApiKey()) {
            throw new Error('请先设置有效的API密钥');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${lat},${lon}&days=5&aqi=yes&alerts=no`
            );
            
            if (!response.ok) {
                throw new Error('无法获取天气预报');
            }
            
            const data = await response.json();
            return this.formatForecastDataWeatherAPI(data);
        } catch (error) {
            console.error('获取天气预报失败:', error);
            throw error;
        }
    }

    // 获取天文数据（日出日落、月相等）
    async getAstronomyData(lat, lon, date = null) {
        if (!this.isValidApiKey()) {
            return this.generateSampleAstronomy();
        }

        try {
            const dateStr = date || new Date().toISOString().split('T')[0];
            const response = await fetch(
                `${this.baseUrl}/astronomy.json?key=${this.apiKey}&q=${lat},${lon}&dt=${dateStr}`
            );
            
            if (!response.ok) {
                return this.generateSampleAstronomy();
            }
            
            const data = await response.json();
            return this.formatAstronomyData(data);
        } catch (error) {
            console.error('获取天文数据失败:', error);
            return this.generateSampleAstronomy();
        }
    }

    // 获取天气预警信息
    async getWeatherAlerts(lat, lon) {
        if (!this.isValidApiKey()) {
            return this.generateSampleAlerts(lat, lon); // 如果没有API密钥，返回示例数据
        }

        try {
            // WeatherAPI的预警功能
            const response = await fetch(
                `${this.alertsUrl}/forecast.json?key=${this.apiKey}&q=${lat},${lon}&days=1&aqi=no&alerts=yes`
            );
            
            if (!response.ok) {
                console.warn('无法获取预警信息，使用备用方案');
                return this.generateSampleAlerts(lat, lon);
            }
            
            const data = await response.json();
            return data.alerts && data.alerts.alert ? this.formatAlertsDataWeatherAPI(data.alerts.alert) : this.generateSampleAlerts(lat, lon);
        } catch (error) {
            console.error('获取预警信息失败:', error);
            // 返回示例预警数据用于演示
            return this.generateSampleAlerts(lat, lon);
        }
    }

    // 格式化当前天气数据 (WeatherAPI格式)
    formatCurrentWeatherDataWeatherAPI(data) {
        return {
            location: {
                name: data.location.name,
                country: data.location.country,
                lat: data.location.lat,
                lon: data.location.lon,
                localtime: data.location.localtime
            },
            current: {
                temperature: Math.round(data.current.temp_f),
                feelsLike: Math.round(data.current.feelslike_f),
                humidity: data.current.humidity,
                pressure: data.current.pressure_in,
                visibility: data.current.vis_miles,
                windSpeed: Math.round(data.current.wind_mph),
                windDirection: data.current.wind_degree,
                description: data.current.condition.text,
                icon: data.current.condition.icon,
                weatherId: data.current.condition.code,
                // 新增数据
                uvIndex: data.current.uv || 0,
                airQuality: data.current.air_quality || null,
                gustSpeed: Math.round(data.current.gust_mph || 0),
                dewPoint: Math.round(data.current.dewpoint_f || 0),
                heatIndex: Math.round(data.current.heatindex_f || data.current.temp_f),
                windChill: Math.round(data.current.windchill_f || data.current.temp_f)
            },
            timestamp: new Date().toISOString()
        };
    }

    // 格式化当前天气数据 (OpenWeatherMap格式 - 保留作为备用)
    formatCurrentWeatherData(data) {
        return {
            location: {
                name: data.name,
                country: data.sys.country,
                lat: data.coord.lat,
                lon: data.coord.lon
            },
            current: {
                temperature: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                humidity: data.main.humidity,
                pressure: (data.main.pressure * 0.02953).toFixed(2), // 转换为inHg
                visibility: data.visibility ? (data.visibility * 0.000621371).toFixed(1) : 'N/A', // 转换为英里
                windSpeed: Math.round(data.wind.speed),
                windDirection: data.wind.deg,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                weatherId: data.weather[0].id
            },
            timestamp: new Date().toISOString()
        };
    }

    // 格式化预报数据 (WeatherAPI格式)
    formatForecastDataWeatherAPI(data) {
        const result = data.forecast.forecastday.map(day => ({
            date: new Date(day.date).toDateString(),
            high: Math.round(day.day.maxtemp_f),
            low: Math.round(day.day.mintemp_f),
            description: day.day.condition.text,
            icon: day.day.condition.icon,
            weatherId: day.day.condition.code,
            // 新增详细数据
            humidity: day.day.avghumidity,
            uvIndex: day.day.uv,
            chanceOfRain: day.day.daily_chance_of_rain,
            chanceOfSnow: day.day.daily_chance_of_snow,
            sunrise: day.astro?.sunrise || '6:00 AM',
            sunset: day.astro?.sunset || '6:00 PM',
            moonPhase: day.astro?.moon_phase || 'Unknown',
            maxWind: Math.round(day.day.maxwind_mph || 0)
        }));
        
        // 添加天文数据到第一天
        if (data.forecast.forecastday[0]?.astro) {
            result[0].astronomy = {
                sunrise: data.forecast.forecastday[0].astro.sunrise,
                sunset: data.forecast.forecastday[0].astro.sunset,
                moonrise: data.forecast.forecastday[0].astro.moonrise,
                moonset: data.forecast.forecastday[0].astro.moonset,
                moonPhase: data.forecast.forecastday[0].astro.moon_phase,
                moonIllumination: data.forecast.forecastday[0].astro.moon_illumination
            };
        }
        
        return result;
    }

    // 格式化预报数据 (OpenWeatherMap格式 - 保留作为备用)
    formatForecastData(data) {
        const dailyData = {};
        
        // 按日期分组预报数据
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyData[date]) {
                dailyData[date] = {
                    temps: [],
                    weather: item.weather[0],
                    date: date
                };
            }
            dailyData[date].temps.push(item.main.temp);
        });

        // 转换为5天预报格式
        return Object.values(dailyData).slice(0, 5).map(day => ({
            date: day.date,
            high: Math.round(Math.max(...day.temps)),
            low: Math.round(Math.min(...day.temps)),
            description: day.weather.description,
            icon: day.weather.icon,
            weatherId: day.weather.id
        }));
    }

    // 格式化预警数据 (WeatherAPI格式)
    formatAlertsDataWeatherAPI(alerts) {
        return alerts.map(alert => ({
            title: alert.headline,
            description: alert.desc,
            severity: this.mapSeverityWeatherAPI(alert.severity),
            start: new Date(alert.effective),
            end: new Date(alert.expires),
            areas: alert.areas ? alert.areas.split(';') : [],
            tags: [alert.severity, alert.certainty]
        }));
    }

    // 格式化预警数据 (OpenWeatherMap格式 - 保留作为备用)
    formatAlertsData(alerts) {
        return alerts.map(alert => ({
            title: alert.event,
            description: alert.description,
            severity: this.mapSeverity(alert.tags),
            start: new Date(alert.start * 1000),
            end: new Date(alert.end * 1000),
            areas: alert.areas || [],
            tags: alert.tags || []
        }));
    }

    // 映射预警严重程度 (WeatherAPI格式)
    mapSeverityWeatherAPI(severity) {
        if (!severity) return 'minor';
        
        const severityLower = severity.toLowerCase();
        if (severityLower.includes('extreme') || severityLower.includes('severe')) {
            return 'severe';
        } else if (severityLower.includes('moderate')) {
            return 'moderate';
        }
        return 'minor';
    }

    // 映射预警严重程度 (OpenWeatherMap格式 - 保留作为备用)
    mapSeverity(tags) {
        if (!tags) return 'minor';
        
        if (tags.includes('Extreme') || tags.includes('Severe')) {
            return 'severe';
        } else if (tags.includes('Moderate')) {
            return 'moderate';
        }
        return 'minor';
    }

    // 生成示例预警数据（用于演示）
    generateSampleAlerts(lat, lon) {
        // 根据地理位置生成相应的示例预警
        const alerts = [];
        
        // 检查是否在易受灾害影响的地区
        if (this.isInTornadoAlley(lat, lon)) {
            alerts.push({
                title: 'Tornado Watch',
                description: 'Conditions are favorable for tornado development. Stay alert and be prepared to take shelter.',
                severity: 'severe',
                start: new Date(),
                end: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6小时后
                areas: ['Central Plains'],
                tags: ['Severe', 'Tornado']
            });
        }
        
        if (this.isInHurricaneZone(lat, lon)) {
            alerts.push({
                title: 'Hurricane Watch',
                description: 'Hurricane conditions possible within 48 hours. Prepare for strong winds and heavy rain.',
                severity: 'severe',
                start: new Date(),
                end: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48小时后
                areas: ['Atlantic Coast'],
                tags: ['Severe', 'Hurricane']
            });
        }

        return alerts;
    }

    // 检查是否在龙卷风走廊
    isInTornadoAlley(lat, lon) {
        // 大致的龙卷风走廊范围：德州到堪萨斯
        return lat >= 32 && lat <= 40 && lon >= -103 && lon <= -94;
    }

    // 检查是否在飓风影响区域
    isInHurricaneZone(lat, lon) {
        // 大西洋沿岸和墨西哥湾沿岸
        return ((lat >= 25 && lat <= 35 && lon >= -85 && lon <= -75) || // 东南沿海
                (lat >= 25 && lat <= 30 && lon >= -95 && lon <= -85));   // 墨西哥湾沿岸
    }

    // 获取天气图标类名
    getWeatherIconClass(weatherId, isDay = true) {
        // 根据天气ID返回相应的Font Awesome图标类
        if (weatherId >= 200 && weatherId < 300) {
            return 'fas fa-bolt'; // 雷暴
        } else if (weatherId >= 300 && weatherId < 400) {
            return 'fas fa-cloud-rain'; // 毛毛雨
        } else if (weatherId >= 500 && weatherId < 600) {
            return 'fas fa-cloud-rain'; // 雨
        } else if (weatherId >= 600 && weatherId < 700) {
            return 'fas fa-snowflake'; // 雪
        } else if (weatherId >= 700 && weatherId < 800) {
            return 'fas fa-smog'; // 雾霾
        } else if (weatherId === 800) {
            return isDay ? 'fas fa-sun' : 'fas fa-moon'; // 晴天
        } else if (weatherId > 800) {
            return 'fas fa-cloud'; // 多云
        }
        return 'fas fa-question'; // 未知
    }

    // 格式化天文数据
    formatAstronomyData(data) {
        const astro = data.astronomy.astro;
        return {
            sunrise: astro.sunrise,
            sunset: astro.sunset,
            moonrise: astro.moonrise,
            moonset: astro.moonset,
            moonPhase: astro.moon_phase,
            moonIllumination: astro.moon_illumination
        };
    }

    // 生成示例天文数据
    generateSampleAstronomy() {
        const now = new Date();
        const sunrise = new Date(now);
        sunrise.setHours(6, 30, 0);
        const sunset = new Date(now);
        sunset.setHours(18, 45, 0);
        
        return {
            sunrise: sunrise.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}),
            sunset: sunset.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}),
            moonrise: '20:15',
            moonset: '08:30',
            moonPhase: 'Waxing Crescent',
            moonIllumination: '23'
        };
    }

    // 计算生活指数
    calculateLifeIndices(weatherData) {
        const temp = weatherData.current.temperature;
        const humidity = weatherData.current.humidity;
        const windSpeed = weatherData.current.windSpeed;
        const uvIndex = weatherData.current.uvIndex;
        const description = weatherData.current.description.toLowerCase();
        
        return {
            // 穿衣指数
            dressing: this.calculateDressingIndex(temp, windSpeed, description),
            // 运动指数
            exercise: this.calculateExerciseIndex(temp, humidity, windSpeed, description),
            // 出行指数
            travel: this.calculateTravelIndex(temp, windSpeed, description),
            // 洗车指数
            carWash: this.calculateCarWashIndex(description, humidity),
            // 过敏指数
            allergy: this.calculateAllergyIndex(temp, humidity, windSpeed),
            // UV指数建议
            uvAdvice: this.getUVAdvice(uvIndex)
        };
    }

    // 穿衣指数计算
    calculateDressingIndex(temp, windSpeed, description) {
        let index = 1;
        let advice = '';
        
        if (temp >= 80) {
            index = 1;
            advice = 'Hot Weather - Light clothing recommended';
        } else if (temp >= 70) {
            index = 2;
            advice = 'Warm Weather - Light layers recommended';
        } else if (temp >= 60) {
            index = 3;
            advice = 'Mild Weather - Light jacket recommended';
        } else if (temp >= 50) {
            index = 4;
            advice = 'Cool Weather - Jacket and layers recommended';
        } else if (temp >= 40) {
            index = 5;
            advice = 'Cold Weather - Warm clothing required';
        } else {
            index = 6;
            advice = 'Very Cold - Heavy winter clothing required';
        }

        // 风力调整
        if (windSpeed > 15) {
            index = Math.min(index + 1, 6);
            advice += ' (Extra layer for wind protection)';
        }

        return { index, advice };
    }

    // 运动指数计算
    calculateExerciseIndex(temp, humidity, windSpeed, description) {
        let index = 3; // 默认适中
        let advice = '';

        if (description.includes('rain') || description.includes('storm')) {
            index = 1;
            advice = 'Poor - Indoor exercise recommended';
        } else if (temp >= 75 && temp <= 85 && humidity < 70) {
            index = 5;
            advice = 'Excellent - Perfect weather for outdoor exercise';
        } else if (temp >= 60 && temp <= 90 && humidity < 80) {
            index = 4;
            advice = 'Good - Great weather for outdoor activities';
        } else if (temp >= 45 && temp <= 95) {
            index = 3;
            advice = 'Fair - Moderate conditions for exercise';
        } else {
            index = 2;
            advice = 'Limited - Consider indoor alternatives';
        }

        return { index, advice };
    }

    // 出行指数计算
    calculateTravelIndex(temp, windSpeed, description) {
        let index = 4; // 默认良好
        let advice = '';

        if (description.includes('storm') || description.includes('severe')) {
            index = 1;
            advice = 'Poor - Travel not recommended';
        } else if (description.includes('rain') || description.includes('snow')) {
            index = 2;
            advice = 'Limited - Drive carefully, consider delays';
        } else if (windSpeed > 25) {
            index = 3;
            advice = 'Fair - High winds may affect travel';
        } else if (temp >= 32 && temp <= 90) {
            index = 5;
            advice = 'Excellent - Perfect weather for travel';
        } else {
            index = 4;
            advice = 'Good - Generally favorable travel conditions';
        }

        return { index, advice };
    }

    // 洗车指数计算
    calculateCarWashIndex(description, humidity) {
        let index = 3;
        let advice = '';

        if (description.includes('rain') || description.includes('storm')) {
            index = 1;
            advice = 'Poor - Rain expected, avoid car washing';
        } else if (humidity > 80) {
            index = 2;
            advice = 'Limited - High humidity may affect drying';
        } else if (humidity < 50) {
            index = 5;
            advice = 'Excellent - Perfect conditions for car washing';
        } else {
            index = 4;
            advice = 'Good - Favorable conditions for car washing';
        }

        return { index, advice };
    }

    // 过敏指数计算
    calculateAllergyIndex(temp, humidity, windSpeed) {
        let index = 3;
        let advice = '';

        if (temp >= 60 && temp <= 80 && humidity >= 30 && humidity <= 60 && windSpeed > 5) {
            index = 5;
            advice = 'Very High - Peak pollen conditions';
        } else if (temp >= 55 && temp <= 85 && windSpeed > 3) {
            index = 4;
            advice = 'High - Elevated pollen levels likely';
        } else if (temp >= 45 && temp <= 90) {
            index = 3;
            advice = 'Moderate - Some allergens may be present';
        } else if (temp < 45 || humidity > 80) {
            index = 2;
            advice = 'Low - Reduced allergen activity';
        } else {
            index = 1;
            advice = 'Very Low - Minimal allergen concerns';
        }

        return { index, advice };
    }

    // UV指数建议
    getUVAdvice(uvIndex) {
        if (uvIndex <= 2) {
            return { level: 'Low', advice: 'Minimal sun protection needed' };
        } else if (uvIndex <= 5) {
            return { level: 'Moderate', advice: 'Sun protection recommended' };
        } else if (uvIndex <= 7) {
            return { level: 'High', advice: 'Sun protection required' };
        } else if (uvIndex <= 10) {
            return { level: 'Very High', advice: 'Extra sun protection essential' };
        } else {
            return { level: 'Extreme', advice: 'Avoid sun exposure during peak hours' };
        }
    }

    // 空气质量指数解读
    interpretAQI(aqi) {
        if (!aqi) return { level: 'Unknown', advice: 'Air quality data unavailable' };
        
        const usEpaIndex = aqi['us-epa-index'] || 0;
        
        if (usEpaIndex <= 50) {
            return { level: 'Good', advice: 'Air quality is satisfactory' };
        } else if (usEpaIndex <= 100) {
            return { level: 'Moderate', advice: 'Air quality is acceptable for most people' };
        } else if (usEpaIndex <= 150) {
            return { level: 'Unhealthy for Sensitive Groups', advice: 'Sensitive individuals should limit outdoor exposure' };
        } else if (usEpaIndex <= 200) {
            return { level: 'Unhealthy', advice: 'Everyone should limit outdoor activities' };
        } else if (usEpaIndex <= 300) {
            return { level: 'Very Unhealthy', advice: 'Avoid outdoor activities' };
        } else {
            return { level: 'Hazardous', advice: 'Everyone should avoid outdoor activities' };
        }
    }

    // 月相图标
    getMoonPhaseIcon(phase) {
        const phases = {
            'New Moon': '🌑',
            'Waxing Crescent': '🌒',
            'First Quarter': '🌓',
            'Waxing Gibbous': '🌔',
            'Full Moon': '🌕',
            'Waning Gibbous': '🌖',
            'Last Quarter': '🌗',
            'Waning Crescent': '🌘'
        };
        return phases[phase] || '🌙';
    }

    // 风向转换
    getWindDirection(degree) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degree / 22.5) % 16;
        return directions[index];
    }
}

// 创建全局天气API实例
const weatherAPI = new WeatherAPI(); 