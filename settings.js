// 设置管理类 - 处理用户个性化设置
class SettingsManager {
    constructor() {
        this.settings = {
            theme: 'dark', // 主题: dark, light, auto
            temperatureUnit: 'fahrenheit', // 温度单位: fahrenheit, celsius
            windSpeedUnit: 'mph', // 风速单位: mph, kmh, ms
            pressureUnit: 'inHg', // 气压单位: inHg, hPa, mb
            distanceUnit: 'miles', // 距离单位: miles, kilometers
            timeFormat: '12hour', // 时间格式: 12hour, 24hour
            language: 'en', // 语言: en, es, fr, de, zh
            notifications: true, // 通知开关
            autoLocation: true, // 自动定位
            refreshInterval: 300000, // 刷新间隔（毫秒）
            favoriteLocations: [], // 收藏的城市
            alertTypes: ['severe', 'moderate', 'minor'], // 预警类型
            soundEnabled: true, // 声音开关
            voiceEnabled: false, // 语音播报
            animationsEnabled: true, // 动画效果
            compactMode: false, // 紧凑模式
            showDetailedInfo: true, // 显示详细信息
            backgroundType: 'dynamic', // 背景类型: static, dynamic, video
            chartColors: 'auto', // 图表颜色: auto, colorful, monochrome
            dataRetention: 7 // 数据保留天数
        };
        
        this.themes = {
            dark: {
                primary: '#1a1a1a',
                secondary: '#2d2d2d',
                accent: '#4a9eff',
                text: '#ffffff',
                textSecondary: '#b0b0b0',
                cardBg: 'rgba(45, 45, 45, 0.7)',
                gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
            },
            light: {
                primary: '#ffffff',
                secondary: '#f5f5f5',
                accent: '#2196f3',
                text: '#333333',
                textSecondary: '#666666',
                cardBg: 'rgba(255, 255, 255, 0.7)',
                gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
            }
        };
        
        this.loadSettings();
        this.initTheme();
    }

    // 加载设置
    loadSettings() {
        try {
            const saved = localStorage.getItem('weatherAppSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    // 保存设置
    saveSettings() {
        try {
            localStorage.setItem('weatherAppSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    // 获取设置值
    get(key) {
        return this.settings[key];
    }

    // 设置值
    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        
        if (key === 'theme') {
            this.applyTheme(value);
        }
        
        return this;
    }

    // 初始化主题
    initTheme() {
        this.applyTheme(this.settings.theme);
    }

    // 应用主题
    applyTheme(themeName) {
        const theme = this.themes[themeName] || this.themes.dark;
        const root = document.documentElement;
        
        Object.keys(theme).forEach(key => {
            root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, theme[key]);
        });
        
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
    }

    // 温度单位转换
    convertTemperature(temp, fromUnit = 'fahrenheit', toUnit = null) {
        toUnit = toUnit || this.settings.temperatureUnit;
        
        if (fromUnit === toUnit) return temp;
        
        if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
            return (temp - 32) * 5/9;
        } else if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
            return (temp * 9/5) + 32;
        }
        
        return temp;
    }

    // 收藏城市管理
    addFavoriteLocation(location) {
        if (!this.settings.favoriteLocations.find(fav => fav.name === location.name)) {
            this.settings.favoriteLocations.push({
                name: location.name,
                coords: location.coords,
                country: location.country,
                addedAt: new Date().toISOString()
            });
            this.saveSettings();
        }
    }

    removeFavoriteLocation(locationName) {
        this.settings.favoriteLocations = this.settings.favoriteLocations.filter(
            fav => fav.name !== locationName
        );
        this.saveSettings();
    }

    getFavoriteLocations() {
        return this.settings.favoriteLocations;
    }

    isFavoriteLocation(locationName) {
        return this.settings.favoriteLocations.some(fav => fav.name === locationName);
    }
}

// 创建全局设置管理实例
window.settingsManager = new SettingsManager(); 