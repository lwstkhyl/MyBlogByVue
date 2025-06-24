//背景图渐变
export const changeBgi = (newBgi) => {
    if (!newBgi) return;
    const app = document.querySelector('#app');
    let opacity = 1;
    const count = 50; //修改次数
    const time = 0.5 * 1000; //渐变时间
    let timerStart = setInterval(() => {
        opacity -= 1 / count;
        app.style.setProperty('--opacity', opacity);
        if (opacity.toFixed(2) <= 0) {
            app.style.setProperty('--opacity', 0);
            clearInterval(timerStart);
            app.style.setProperty('--bgi', `url(${newBgi})`);
            let timerEnd = setInterval(() => {
                opacity += 1 / count;
                app.style.setProperty('--opacity', opacity);
                if (opacity.toFixed(2) >= 1) {
                    app.style.setProperty('--opacity', 1);
                    clearInterval(timerEnd);
                }
            }, time / count);
        }
    }, time / count);
};