// 主应用程序类
class WeatherApp {
    constructor() {
        this.currentWeatherData = null;
        this.currentForecastData = null;
        this.isLoading = false;
        this.init();
    }

    // 初始化应用程序
    async init() {
        this.setupEventListeners();
        this.showApiKeyInstructions();
        
        // 尝试加载默认位置的天气
        await this.loadDefaultWeather();
    }

    // 设置事件监听器
    setupEventListeners() {
        // GPS定位按钮
        const gpsBtn = document.getElementById('gps-btn');
        if (gpsBtn) {
            gpsBtn.addEventListener('click', () => this.handleGPSLocation());
        }

        // 城市搜索
        const searchBtn = document.getElementById('search-btn');
        const citySearch = document.getElementById('city-search');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleCitySearch());
        }
        
        if (citySearch) {
            citySearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleCitySearch();
                }
            });
            
            // 实时搜索建议
            citySearch.addEventListener('input', (e) => {
                this.showSearchSuggestions(e.target.value);
            });
        }

        // 新功能事件监听器
        this.setupNewFeatureListeners();
    }

    // 设置新功能事件监听器
    setupNewFeatureListeners() {
        // 设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }

        // 收藏按钮
        const favoritesBtn = document.getElementById('favorites-btn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => this.showFavoritesModal());
        }

        // 全屏按钮
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // 浮动控制按钮
        const refreshBtn = document.getElementById('refresh-btn');
        const shareBtn = document.getElementById('share-btn');
        const voiceBtn = document.getElementById('voice-btn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.showShareModal());
        }
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.speakWeather());
        }

        // 模态窗口关闭按钮
        this.setupModalListeners();

        // 设置项事件监听器
        this.setupSettingsListeners();
    }

    // 设置模态窗口监听器
    setupModalListeners() {
        // 关闭按钮
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal);
                }
            });
        });

        // 点击外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });
    }

    // 设置项监听器
    setupSettingsListeners() {
        // 主题选择
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                settingsManager.set('theme', e.target.value);
            });
        }

        // 温度单位
        const tempUnit = document.getElementById('temp-unit');
        if (tempUnit) {
            tempUnit.addEventListener('change', (e) => {
                settingsManager.set('temperatureUnit', e.target.value);
                this.updateTemperatureDisplay();
            });
        }

        // 功能开关
        const notificationsToggle = document.getElementById('notifications-toggle');
        const voiceToggle = document.getElementById('voice-toggle');
        const animationsToggle = document.getElementById('animations-toggle');

        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', (e) => {
                settingsManager.set('notifications', e.target.checked);
            });
        }
        if (voiceToggle) {
            voiceToggle.addEventListener('change', (e) => {
                settingsManager.set('voiceEnabled', e.target.checked);
            });
        }
        if (animationsToggle) {
            animationsToggle.addEventListener('change', (e) => {
                settingsManager.set('animationsEnabled', e.target.checked);
            });
        }

        // 重置设置
        const resetBtn = document.getElementById('reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('确定要重置所有设置吗？')) {
                    settingsManager.resetSettings();
                    this.loadSettingsUI();
                }
            });
        }
    }

    // 显示API密钥设置说明
    showApiKeyInstructions() {
        if (!weatherAPI.isValidApiKey()) {
            console.log('=== 天气API设置说明 ===');
            console.log('1. 访问 https://openweathermap.org/api');
            console.log('2. 注册免费账户并获取API密钥');
            console.log('3. 在 weather-api.js 文件中替换 YOUR_API_KEY_HERE');
            console.log('4. 刷新页面即可使用');
            
            // 在界面上显示提示
            this.showMessage('请先设置OpenWeatherMap API密钥才能获取实时天气数据', 'warning');
        }
    }

    // 加载默认天气（纽约）
    async loadDefaultWeather() {
        try {
            await this.loadWeatherForCity('New York');
        } catch (error) {
            console.error('加载默认天气失败:', error);
            this.showDemoWeather();
        }
    }

    // 处理GPS定位
    async handleGPSLocation() {
        if (!locationService.isGPSAvailable) {
            this.showMessage('您的浏览器不支持GPS定位功能', 'error');
            return;
        }

        this.showLoading('正在获取您的位置...');

        try {
            const position = await locationService.getCurrentPosition();
            
            // 检查是否在美国境内
            if (!locationService.isInUSA(position.lat, position.lon)) {
                this.showMessage('此服务仅支持美国境内的天气预报', 'warning');
                this.hideLoading();
                return;
            }

            await this.loadWeatherForCoords(position.lat, position.lon);
            
            // 更新位置显示
            const nearestCity = await locationService.getNearestCity(position.lat, position.lon);
            this.updateLocationDisplay(nearestCity || position);
            
        } catch (error) {
            console.error('GPS定位失败:', error);
            this.showMessage(error.message, 'error');
            this.hideLoading();
        }
    }

    // 处理城市搜索
    async handleCitySearch() {
        const citySearch = document.getElementById('city-search');
        if (!citySearch) return;

        const cityName = citySearch.value.trim();
        if (!cityName) {
            this.showMessage('请输入城市名称', 'warning');
            return;
        }

        await this.loadWeatherForCity(cityName);
    }

    // 根据城市名加载天气
    async loadWeatherForCity(cityName) {
        this.showLoading(`正在加载 ${cityName} 的天气信息...`);

        try {
            let weatherData;
            
            // 首先尝试从本地城市数据获取坐标
            const cityCoords = locationService.getCityCoordinates(cityName);
            if (cityCoords) {
                weatherData = await weatherAPI.getCurrentWeatherByCoords(cityCoords.lat, cityCoords.lon);
                this.updateLocationDisplay(cityCoords);
            } else {
                // 使用API搜索城市
                weatherData = await weatherAPI.getCurrentWeatherByCity(cityName);
                this.updateLocationDisplay(weatherData.location);
            }

            await this.displayWeatherData(weatherData);
            await this.loadForecastAndAlerts(weatherData.location.lat, weatherData.location.lon);
            
        } catch (error) {
            console.error('加载城市天气失败:', error);
            this.showMessage(`无法找到城市 "${cityName}" 的天气信息`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 根据坐标加载天气
    async loadWeatherForCoords(lat, lon) {
        try {
            const weatherData = await weatherAPI.getCurrentWeatherByCoords(lat, lon);
            await this.displayWeatherData(weatherData);
            await this.loadForecastAndAlerts(lat, lon);
        } catch (error) {
            console.error('加载坐标天气失败:', error);
            this.showMessage('无法获取当前位置的天气信息', 'error');
        }
    }

    // 加载预报和预警信息
    async loadForecastAndAlerts(lat, lon) {
        try {
            // 并行加载预报和预警
            const [forecastData] = await Promise.allSettled([
                weatherAPI.getForecast(lat, lon),
                alertManager.updateAlerts(lat, lon)
            ]);

            if (forecastData.status === 'fulfilled') {
                this.displayForecast(forecastData.value);
            }
        } catch (error) {
            console.error('加载预报和预警失败:', error);
        }
    }

    // 显示天气数据
    async displayWeatherData(data) {
        this.currentWeatherData = data;
        
        // 更新主要天气信息
        this.updateElement('current-temp', data.current.temperature);
        this.updateElement('feels-like', data.current.feelsLike);
        this.updateElement('weather-desc', data.current.description);
        this.updateElement('humidity', `${data.current.humidity}%`);
        this.updateElement('pressure', `${data.current.pressure} inHg`);
        this.updateElement('visibility', `${data.current.visibility} mi`);
        this.updateElement('wind-speed', `${data.current.windSpeed} mph`);

        // 更新新增的天气信息
        this.updateElement('uv-index', data.current.uvIndex || '--');
        
        // 空气质量
        if (data.current.airQuality) {
            const aqiInfo = weatherAPI.interpretAQI(data.current.airQuality);
            this.updateElement('air-quality', aqiInfo.level);
        } else {
            this.updateElement('air-quality', '--');
        }

        // 更新天气图标
        const iconElement = document.getElementById('main-weather-icon');
        if (iconElement) {
            const iconClass = weatherAPI.getWeatherIconClass(data.current.weatherId);
            iconElement.className = iconClass;
        }

        // 更新天文信息
        await this.updateAstronomyInfo(data.location.lat, data.location.lon);
        
        // 更新生活指数
        this.updateLifeIndices(data);
    }

    // 显示天气预报
    displayForecast(forecastData) {
        this.currentForecastData = forecastData;
        
        // 创建天气图表
        this.createWeatherCharts(forecastData);
        const container = document.getElementById('forecast-container');
        if (!container) return;

        const forecastHTML = forecastData.map(day => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const iconClass = weatherAPI.getWeatherIconClass(day.weatherId);
            
            return `
                <div class="forecast-card">
                    <div class="forecast-date">${dayName}</div>
                    <div class="forecast-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="forecast-desc">${day.description}</div>
                    <div class="forecast-temps">
                        <span class="temp-high">${day.high}°</span>
                        <span class="temp-low">${day.low}°</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = forecastHTML;
    }

    // 显示演示天气（当API不可用时）
    showDemoWeather() {
        const demoData = {
            location: { name: 'Demo City', country: 'US' },
            current: {
                temperature: 72,
                feelsLike: 75,
                description: 'partly cloudy',
                humidity: 65,
                pressure: '30.15',
                visibility: '10.0',
                windSpeed: 8,
                weatherId: 801
            }
        };

        this.displayWeatherData(demoData);
        this.updateLocationDisplay({ name: 'Demo City', state: 'US' });
        
        // 显示演示预报
        const demoForecast = [
            { date: new Date(Date.now() + 86400000).toDateString(), high: 75, low: 62, description: 'sunny', weatherId: 800 },
            { date: new Date(Date.now() + 172800000).toDateString(), high: 78, low: 65, description: 'partly cloudy', weatherId: 801 },
            { date: new Date(Date.now() + 259200000).toDateString(), high: 73, low: 59, description: 'light rain', weatherId: 500 },
            { date: new Date(Date.now() + 345600000).toDateString(), high: 69, low: 55, description: 'cloudy', weatherId: 804 },
            { date: new Date(Date.now() + 432000000).toDateString(), high: 71, low: 58, description: 'partly cloudy', weatherId: 802 }
        ];
        
        this.displayForecast(demoForecast);
        this.showMessage('当前显示演示数据，请设置API密钥获取实时天气', 'info');
    }

    // 显示搜索建议
    showSearchSuggestions(query) {
        if (!query || query.length < 2) return;

        const suggestions = locationService.searchCity(query);
        if (suggestions.length === 0) return;

        // 这里可以实现下拉建议功能
        console.log('搜索建议:', suggestions.map(city => `${city.name}, ${city.state}`));
    }

    // 更新位置显示
    updateLocationDisplay(location) {
        const locationElement = document.getElementById('current-location');
        if (locationElement) {
            const displayText = locationService.formatLocationDisplay(location);
            locationElement.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <span>${displayText}</span>
            `;
        }
    }

    // 显示加载状态
    showLoading(message = '加载中...') {
        this.isLoading = true;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            overlay.classList.remove('hidden');
        }
    }

    // 隐藏加载状态
    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // 显示消息提示
    showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 可以在这里实现Toast通知
        // 暂时使用console输出
    }

    // 更新元素内容
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    // 刷新天气数据
    async refresh() {
        if (this.isLoading) return;

        const currentLocation = locationService.getCurrentLocation();
        if (currentLocation) {
            await this.loadWeatherForCoords(currentLocation.lat, currentLocation.lon);
        } else if (this.currentWeatherData) {
            const { lat, lon } = this.currentWeatherData.location;
            await this.loadWeatherForCoords(lat, lon);
        }
    }

    // 更新天文信息
    async updateAstronomyInfo(lat, lon) {
        try {
            const astronomyData = await weatherAPI.getAstronomyData(lat, lon);
            
            this.updateElement('sunrise', astronomyData.sunrise);
            this.updateElement('sunset', astronomyData.sunset);
            this.updateElement('moon-phase', astronomyData.moonPhase);
            
            // 更新月相图标
            const moonIcon = document.getElementById('moon-phase-icon');
            if (moonIcon) {
                moonIcon.textContent = weatherAPI.getMoonPhaseIcon(astronomyData.moonPhase);
            }
        } catch (error) {
            console.error('更新天文信息失败:', error);
        }
    }

    // 更新生活指数
    updateLifeIndices(weatherData) {
        const indices = weatherAPI.calculateLifeIndices(weatherData);
        
        // 穿衣指数
        this.updateElement('dressing-index', indices.dressing.index);
        this.updateElement('dressing-advice', indices.dressing.advice);
        
        // 运动指数
        this.updateElement('exercise-index', indices.exercise.index);
        this.updateElement('exercise-advice', indices.exercise.advice);
        
        // 出行指数
        this.updateElement('travel-index', indices.travel.index);
        this.updateElement('travel-advice', indices.travel.advice);
        
        // 洗车指数
        this.updateElement('carwash-index', indices.carWash.index);
        this.updateElement('carwash-advice', indices.carWash.advice);
        
        // 过敏指数
        this.updateElement('allergy-index', indices.allergy.index);
        this.updateElement('allergy-advice', indices.allergy.advice);
        
        // UV指数建议
        this.updateElement('uv-level', indices.uvAdvice.level);
        this.updateElement('uv-advice', indices.uvAdvice.advice);
    }

    // 创建天气图表
    createWeatherCharts(forecastData) {
        if (!window.weatherCharts || !forecastData) return;
        
        try {
            // 温度趋势图
            weatherCharts.createTemperatureChart('temperature-chart', forecastData);
            
            // 降水概率图 - 使用简化的数据结构
            const precipData = forecastData.map(day => ({
                ...day,
                chanceOfRain: day.chanceOfRain || Math.random() * 100,
                chanceOfSnow: day.chanceOfSnow || 0
            }));
            
            weatherCharts.createTemperatureChart('precipitation-chart', precipData);
        } catch (error) {
            console.error('创建图表失败:', error);
        }
    }

    // 显示设置模态窗口
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            this.loadSettingsUI();
            this.showModal(modal);
        }
    }

    // 显示收藏位置模态窗口
    showFavoritesModal() {
        const modal = document.getElementById('favorites-modal');
        if (modal) {
            this.loadFavoritesUI();
            this.showModal(modal);
        }
    }

    // 显示分享模态窗口
    showShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            this.generateShareContent();
            this.showModal(modal);
        }
    }

    // 显示模态窗口
    showModal(modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // 隐藏模态窗口
    hideModal(modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // 加载设置界面
    loadSettingsUI() {
        const themeSelect = document.getElementById('theme-select');
        const tempUnit = document.getElementById('temp-unit');
        const notificationsToggle = document.getElementById('notifications-toggle');
        const voiceToggle = document.getElementById('voice-toggle');
        const animationsToggle = document.getElementById('animations-toggle');

        if (themeSelect) themeSelect.value = settingsManager.get('theme');
        if (tempUnit) tempUnit.value = settingsManager.get('temperatureUnit');
        if (notificationsToggle) notificationsToggle.checked = settingsManager.get('notifications');
        if (voiceToggle) voiceToggle.checked = settingsManager.get('voiceEnabled');
        if (animationsToggle) animationsToggle.checked = settingsManager.get('animationsEnabled');
    }

    // 加载收藏位置界面
    loadFavoritesUI() {
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) return;

        const favorites = settingsManager.getFavoriteLocations();
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = `
                <div class="no-favorites">
                    <i class="fas fa-heart"></i>
                    <p>No favorite locations yet</p>
                </div>
            `;
            return;
        }

        favoritesList.innerHTML = favorites.map(fav => `
            <div class="favorite-item">
                <div class="favorite-info">
                    <h4>${fav.name}</h4>
                    <p>${fav.country}</p>
                </div>
                <div class="favorite-actions">
                    <button class="btn btn-small btn-primary" onclick="app.loadFavoriteLocation('${fav.name}')">
                        Load
                    </button>
                    <button class="btn btn-small btn-warning" onclick="app.removeFavoriteLocation('${fav.name}')">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 生成分享内容
    generateShareContent() {
        if (!this.currentWeatherData) return;

        const data = this.currentWeatherData;
        const shareContent = `
            <b>Weather Update for ${data.location.name}</b><br>
            🌡️ Temperature: ${data.current.temperature}°F (Feels like ${data.current.feelsLike}°F)<br>
            ☁️ Conditions: ${data.current.description}<br>
            💨 Wind: ${data.current.windSpeed} mph<br>
            💧 Humidity: ${data.current.humidity}%<br>
            👁️ Visibility: ${data.current.visibility} miles<br>
            📊 Pressure: ${data.current.pressure} inHg
        `;

        const shareContentDiv = document.getElementById('share-content');
        if (shareContentDiv) {
            shareContentDiv.innerHTML = shareContent;
        }
    }

    // 语音播报天气
    speakWeather() {
        if (!this.currentWeatherData || !settingsManager.get('voiceEnabled')) {
            this.showMessage('Voice feature is disabled or no weather data available', 'warning');
            return;
        }

        const data = this.currentWeatherData;
        const text = `Current weather in ${data.location.name}: ${data.current.description}. Temperature is ${data.current.temperature} degrees Fahrenheit, feels like ${data.current.feelsLike}. Wind speed is ${data.current.windSpeed} miles per hour. Humidity is ${data.current.humidity} percent.`;
        
        settingsManager.speak(text);
    }

    // 切换全屏模式
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                this.showMessage('Unable to enter fullscreen mode', 'error');
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // 加载收藏位置天气
    async loadFavoriteLocation(locationName) {
        this.hideModal(document.getElementById('favorites-modal'));
        await this.loadWeatherForCity(locationName);
    }

    // 移除收藏位置
    removeFavoriteLocation(locationName) {
        settingsManager.removeFavoriteLocation(locationName);
        this.loadFavoritesUI();
        this.showMessage(`Removed ${locationName} from favorites`, 'success');
    }

    // 添加当前位置到收藏
    addCurrentToFavorites() {
        if (!this.currentWeatherData) {
            this.showMessage('No current location to add', 'warning');
            return;
        }

        const location = {
            name: this.currentWeatherData.location.name,
            coords: {
                lat: this.currentWeatherData.location.lat,
                lon: this.currentWeatherData.location.lon
            },
            country: this.currentWeatherData.location.country
        };

        settingsManager.addFavoriteLocation(location);
        this.loadFavoritesUI();
        this.showMessage(`Added ${location.name} to favorites`, 'success');
    }

    // 更新温度显示单位
    updateTemperatureDisplay() {
        if (!this.currentWeatherData) return;

        const unit = settingsManager.get('temperatureUnit');
        const currentTemp = this.currentWeatherData.current.temperature;
        const feelsLike = this.currentWeatherData.current.feelsLike;

        let displayTemp = currentTemp;
        let displayFeels = feelsLike;

        if (unit === 'celsius') {
            displayTemp = Math.round(settingsManager.convertTemperature(currentTemp, 'fahrenheit', 'celsius'));
            displayFeels = Math.round(settingsManager.convertTemperature(feelsLike, 'fahrenheit', 'celsius'));
        }

        this.updateElement('current-temp', displayTemp);
        this.updateElement('feels-like', displayFeels);

        // 更新单位显示
        const unitElements = document.querySelectorAll('.unit');
        unitElements.forEach(el => {
            el.textContent = unit === 'celsius' ? '°C' : '°F';
        });
    }

    // 分享天气信息
    shareWeatherText() {
        if (!this.currentWeatherData) return;

        const data = this.currentWeatherData;
        const text = `Weather in ${data.location.name}: ${data.current.temperature}°F, ${data.current.description}. Wind: ${data.current.windSpeed} mph, Humidity: ${data.current.humidity}%`;

        if (navigator.share) {
            navigator.share({
                title: 'Weather Update',
                text: text,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage('Weather info copied to clipboard', 'success');
            });
        }
    }

    // 复制链接
    copyWeatherLink() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            this.showMessage('Link copied to clipboard', 'success');
        });
    }
}

// 当DOM加载完成后初始化应用程序
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
    
    // 设置定时刷新（每30分钟）
    setInterval(() => {
        if (window.weatherApp && !window.weatherApp.isLoading) {
            window.weatherApp.refresh();
        }
    }, 30 * 60 * 1000);
});

// 处理页面可见性变化，当页面重新获得焦点时刷新数据
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.weatherApp) {
        window.weatherApp.refresh();
    }
}); 